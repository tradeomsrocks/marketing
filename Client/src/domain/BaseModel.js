// Base Model for all domain models
// Provides nifty intelligent merging and type conversion
GetContext('TradeOMS.domain').BaseModel = Backbone.Model.extend({

    constructor: function () {
        TradeOMS.domain.BaseModel.initializeAttributeDefinitions(this.constructor);

        // Invoking this triggers the initialize(), set() functions
        Backbone.Model.apply(this, arguments);

        this._initializeCalculatedAttributes();

        this._hasConstructorCompleted = true;
    },

    // Initialize the calculated attributes AFTER all of the attribute values have been initially set in the
    // constructor because
    _initializeCalculatedAttributes: function () {
        var _this = this, attributeName, definition;

        for (attributeName in this._calculatedAttributeDefinitions) {
            definition = this._calculatedAttributeDefinitions[attributeName];

            // Build up the dependency listeners to trigger the calculation
            // Dependencies that are collections are more complicated because we listen to the 'all' event on collections to trigger calculations
            _.each(definition.dependencies, function (dependencyName) {
                var calculation = definition.calculation, allEventHandler;

                allEventHandler = function () {
                    calculation(_this);
                };

                _this.on('change:' + dependencyName, function () {
                    // Un-register the previous collection all event to avoid getting that collection's all events
                    if (_this.previous(dependencyName) instanceof Backbone.Collection) {
                        _this.previous(dependencyName).off('all', allEventHandler);
                    }

                    calculation(_this);

                    if (_this.get(dependencyName) instanceof Backbone.Collection) {
                        _this.get(dependencyName).on('all', allEventHandler);
                    }
                });

                // initially register for allEventHandler if the current value is a collection, don't wait for the 'change' event
                if (_this.get(dependencyName) instanceof Backbone.Collection) {
                    _this.get(dependencyName).on('all', allEventHandler);
                }
            });

            // Trigger the calculation immediately, internally the calculation can check _hasConstructorCompleted if it's important to delay calculation
            definition.calculation(_this);
        }
    },

    _getAttributeDefinition: function (attributeName) {
        return this._attributeDefinitions[attributeName];
    },

    // This implementation of get will perform conversion on an attribute if it's not the correct type.
    // For example, if this object has an attribute that is a backbone model but hasn't been converted to a backbone
    // model from a javascript object the conversion will be performed at this time.
    get: function (attributeName, options) {
        var currentValue, attributeDefinition;

        currentValue = this.attributes[attributeName];

        if (currentValue !== undefined && currentValue !== null) {
            attributeDefinition = this._getAttributeDefinition(attributeName);

            if (attributeDefinition && !(currentValue instanceof attributeDefinition._typeClass)) {
                TradeOMS.assert(!(currentValue instanceof Backbone.Model), 'Base model tried to set ' + attributeName + ' to the wrong type.');
                currentValue = this.attributes[attributeName] = this._resolveAttributeInstance(currentValue, attributeDefinition, options);
            }
        }

        return currentValue;
    },

    _resolveAttributeInstance: function (currentValue, attributeDefinition, options) {
        var newCollection;

        if (attributeDefinition.relationship.type === TradeOMS.domain.BaseModel.HAS_A) {
            if (Gryphon.isClassOfType(attributeDefinition._typeClass, Backbone.Collection)) {
                Gryphon.assert(_.isArray(currentValue), 'Why did someone try to set a collection without using an array?');
                newCollection = new (attributeDefinition._typeClass)();

                Gryphon.assert(attributeDefinition._typeClass.prototype.model, 'Found a collection that had an undefined model');
                // This is where a lot of magic with collections happens for has-a relationships
                // Override the Backbone.Collection.prototype._prepareModel so that anytime a model is added
                // if the new model is a pojo it is converted via the relationship resolver
                newCollection._prepareModel = function (attrs, options) {
                    if (attrs.constructor === Object) {
                        return this._invokeResolver(attrs, attributeDefinition, options);
                    }
                    else {
                        return Backbone.Collection.prototype._prepareModel(attrs, options);
                    }
                }.bind(this);

                newCollection.add(currentValue, options);

                return newCollection;
            }
            else {
                return this._invokeResolver(currentValue, attributeDefinition, options);
            }
        }
        else {
            return new (attributeDefinition._typeClass)(currentValue);
        }
    },

    _invokeResolver: function (currentValue, attributeDefinition, options) {
        var resolver = attributeDefinition.relationship.resolver;

        if (resolver === Gryphon.domain.BaseModel.SESSION) {
            Gryphon.assert(currentValue.id !== undefined, 'The id was missing for a has-a type of relationship ');
            return Gryphon.session.getOrFetchModel(attributeDefinition.type, currentValue.id, options);
        }
        else {
            Gryphon.assert(_.isFunction(resolver), 'Resolvers should be SESSION or a function');
            return resolver.call(this, this, currentValue, attributeDefinition, options);
        }
    },

    fetch: function (options) {
        var xhr;

        if (options === undefined) {
            options = {};
        }
        options.unsetMissingAttributes = true;

        xhr = Backbone.Model.prototype.fetch.call(this, options);

        if (this.hasSnapshots()) {
            xhr.done(function () {
                // If the model previously had a snapshot it needs to be replaced because the model
                // has now changed to a different baseline
                // sbw todo - add unit tests for this case
                this.createAndReplaceLastSnapshot();
            }.bind(this));
        }

        return xhr;
    },

    set: function (key, value, options) {
        var attributes;

        if (typeof key === 'object') {
            attributes = key;
            options = value;
        } else {
            (attributes = {})[key] = value;
        }

        // deeply convert any null values to be undefined values recursively through all attributes
        Gryphon.replaceNullsWithUndefined(attributes);
        this._mergeSet(attributes, options || {});

        return this;
    },

    _mergeSet: function (newAttributes, options) {
        var attributeName,
            attributeDefinition,
            newAttributeNames;

        // Don't perform a merge set recursively and do not merge set until the object is fully constructed
        if (this._hasConstructorCompleted && !this._isInMergeSet) {
            try {
                this._isInMergeSet = true;

                if (options.unsetMissingAttributes) {
                    // You need to create a copy of the attribute names because they might be removed from the newAttributes
                    newAttributeNames = _.keys(newAttributes);
                }

                // Recursively find all of the nested models/collection and merge them if necessary, follows the newAttributes
                // for recursion rather than the model's existing attributes
                for (attributeName in newAttributes) {
                    if (newAttributes[attributeName]) {
                        attributeDefinition = this._getAttributeDefinition(attributeName);

                        if (attributeDefinition) {
                            if (this.attributes[attributeName] instanceof Backbone.Model) {
                                this._mergeSetModel(newAttributes, attributeName, attributeDefinition, options);
                            }
                            else if (this.attributes[attributeName] instanceof Backbone.Collection) {
                                this._mergeSetCollection(newAttributes, attributeName, attributeDefinition, options);
                            }
                            else {
                                // The new value will simply overwrite the old one. Make sure it looks correct
                                this._verifyObjectType(attributeDefinition, newAttributes[attributeName]);
                            }
                        }
                    }
                }

                // Call set with any remaining newAttributes that are primitives or the nested models have changed to brand new ids
                Backbone.Model.prototype.set.call(this, newAttributes, options);

                if (newAttributeNames) {
                    this._mergeUnset(newAttributeNames, options);
                }
            }
            finally {
                this._isInMergeSet = false;
            }
        }
        else {
            Backbone.Model.prototype.set.call(this, newAttributes, options);
        }
    },

    // The only function that should call this is _mergeSet
    // Only handles when the existing value is a Backbone.Model and the new value is a pojo
    // If the ids are the same or the existing value was a new object it means we must perform a merge
    // If the ids are different we will go through the normal instance resolver mechanism and we are completely
    // resetting the nested model so there is nothing else we need to do.
    _mergeSetModel: function (newAttributes, attributeName, attributeDefinition, options) {
        var existingModel = this.attributes[attributeName],
            newRawValue = newAttributes[attributeName];

        if (_.isObject(newRawValue)) {
            if (newRawValue instanceof Backbone.Model) {
                // If the new model is the wrong type we need to complain about it
                // If the value is the correct type the _mergeSet will take care of updating the attribute
                this._verifyObjectType(attributeDefinition, newRawValue);
            }
            else {
                if (attributeDefinition.relationship.type === Gryphon.domain.BaseModel.HAS_A) {
                    if (existingModel.id === newRawValue.id) {
                        // The ids are identical for a has-a relationship. There is nothing to change. Just use the existing model.
                        delete newAttributes[attributeName];
                    }
                    else {
                        // Otherwise the id's have changed, let the _mergeSet handle this by updating the attribute value
                        Gryphon.assert(newRawValue === undefined || newRawValue.id, 'Has-a models should have an id');
                    }
                }
                else {
                    if (existingModel.id === undefined || newRawValue.id === undefined || existingModel.id === newRawValue.id) {
                        existingModel._mergeSet(newRawValue, options);
                        // You have to clear this out so the value is not overwritten with a brand new model later in _mergeSet
                        delete newAttributes[attributeName];
                    }
                }
            }
        }
    },

    _mergeSetCollection: function (newAttributes, attributeName, attributeDefinition, options) {
        if (_.isArray(newAttributes[attributeName])) {
            if (attributeDefinition.relationship.type === Gryphon.domain.BaseModel.OWNS_A) {
                this._mergeSetOwnsACollection(newAttributes, attributeName, attributeDefinition, options);
            }
            else {
                this._mergeSetHasACollection(newAttributes, attributeName);
            }

            // Make sure to delete the attribute so it's not overwritten with a brand new array later in _mergeSet
            delete newAttributes[attributeName];
        }
        else {
            // We are trying to set to an existing backbone collection with something that is not
            // an array.  Make sure that the new item is a well formed Backbone Collection
            this._verifyObjectType(attributeDefinition, newAttributes[attributeName]);
            // Setting this attribute value will be handled later in the _mergeSet
        }
    },

    // sbw todo - not enough unit tests for this case
    _mergeSetHasACollection: function (newAttributes, attributeName) {
        var existingCollection = this.attributes[attributeName],
            matchesNotFound = new Backbone.Collection(existingCollection.models),
            newArray = newAttributes[attributeName],
            newArrayCount,
            newItem,
            match;

        // Find all existing matches
        for (newArrayCount = 0; newArrayCount < newArray.length; newArrayCount++) {
            newItem = newArray[newArrayCount];
            match = matchesNotFound.get(newItem.id);

            if (match) {
                matchesNotFound.remove(match);
                newArray.splice(newArrayCount--, 1);
            }
        }

        // Now add any new items that we could not find matches for
        for (newArrayCount = 0; newArrayCount < newArray.length; newArrayCount++) {
            existingCollection.add(newArray[newArrayCount]);
        }

        // Now remove any existing models that we could not find matches for
        matchesNotFound.forEach(function (notFound) {
            existingCollection.remove(notFound);
        });
    },

    _mergeSetOwnsACollection: function (newAttributes, attributeName, attributeDefinition, options) {
        var existingCollection = this.attributes[attributeName],
            matchesNotFound = new Backbone.Collection(existingCollection.models),
            newArray = newAttributes[attributeName],
            newArrayCount,
            newItem,
            match,
            jsonFormat;

        // Take care of all new items that can find matches by ids
        for (newArrayCount = 0; newArrayCount < newArray.length; newArrayCount++) {
            newItem = newArray[newArrayCount];
            match = matchesNotFound.get(newItem.id);

            if (match) {
                matchesNotFound.remove(match);
                newArray.splice(newArrayCount--, 1);

                match.set((newItem instanceof Backbone.Model ? newItem.attributes : newItem), options);
            }
        }

        jsonFormat = Gryphon.domain.BaseModel.getJSONFormat(attributeDefinition._typeClass);

        // Now take care of all new items that can be matched by attributes but NOT ids
        for (newArrayCount = 0; newArrayCount < newArray.length; newArrayCount++) {
            newItem = newArray[newArrayCount];

            // Only use new items that have ids because in this situation the only thing that
            // should have changed is the id.  This is when new nested models are saved and then we
            // get browser push updates that now have ids
            if (newItem.id) {
                match = this._findMatchForCollectionMerge(newItem, matchesNotFound, jsonFormat);

                if (match) {
                    matchesNotFound.remove(match);
                    newArray.splice(newArrayCount--, 1);

                    // In this situation, the only thing that could have changed is the id.
                    // The objects were semantically equivalent
                    match.set({ id: newItem.id }, options);
                }
            }
        }

        // Now add any new items that we could not find matches for
        for (newArrayCount = 0; newArrayCount < newArray.length; newArrayCount++) {
            existingCollection.add(newArray[newArrayCount]);
        }

        // Now remove any existing models that we could not find matches for
        matchesNotFound.forEach(function (notFound) {
            existingCollection.remove(notFound);
        });
    },

    // This should match on attribute recursively and ignore the values id, cid, null, '', undefined
    // It ignores ids because we already tried to match by ids and it failed.  Now ignore ids for matching.
    _findMatchForCollectionMerge: function (locateItem, checkThisCollection, jsonFormat) {
        var locateItemJSON, checkJSON;

        if (checkThisCollection.length === 0) {
            return undefined;
        }

        locateItemJSON = TradeOMS.util.convertToJSON(locateItem, jsonFormat);
        Gryphon.domain.BaseModel._cleanJSONForMergeCompare(locateItemJSON);

        return checkThisCollection.find(function (checkModel) {
            // cache this JSON structure in the temporary checkThisCollection because it is expensive to calculate
            if (!checkThisCollection._cachedJSON) {
                checkThisCollection._cachedJSON = {};
            }
            if (!checkThisCollection._cachedJSON[checkModel.cid]) {
                checkJSON = Gryphon.convertToJSON(checkModel, jsonFormat);
                Gryphon.domain.BaseModel._cleanJSONForMergeCompare(checkJSON);
                checkThisCollection._cachedJSON[checkModel.cid] = checkJSON;
            }

            checkJSON = checkThisCollection._cachedJSON[checkModel.cid];
            return Gryphon.domain.BaseModel.isJSONDeepEquals(locateItemJSON, checkJSON);
        });
    },

    // iterate through the existing values and if the value does not exist in the newAttributes then unset it
    // this is not recursive, the _mergeSetModel is recursive and that will call __mergeUnset for nested models
    // calculated attributes should have never been set (removed from JSON) so you don't need to worry about them
    _mergeUnset: function (newAttributeNames, options) {
        var attributeName;

        for (attributeName in this.attributes) {
            if (this.attributes[attributeName] &&
                _.indexOf(newAttributeNames, attributeName) === -1
                && !this._isCalculatedAttribute(attributeName)) {
                Backbone.Model.prototype.unset.call(this, attributeName, options);
            }
        }
    },

    // Raises an assertion of the checkObj is a backbone model or collection but isn't the right type
    _verifyObjectType: function (attributeDefinition, checkObj) {
        if (checkObj instanceof Backbone.Model || checkObj instanceof Backbone.Collection) {
            Gryphon.assert(checkObj instanceof attributeDefinition._typeClass, 'You are trying to set an attribute to the wrong type.');
        }
    },

    toJSON: function (options) {
        try {
            // temporary backwards compatibility with the convertToJSON function, eventually this should be removed
            if (!options || !options.keepCIDs)
                Gryphon.convertToJSON._excludeCIDs = true;
            return Gryphon.convertToJSON(this, this._attributeDefinitions._jsonFormat);
        }
        finally {
            Gryphon.convertToJSON._excludeCIDs = false;
        }
    },

    _getSnapshots: function () {
        if (!this._snapshots) {
            this._snapshots = [];
        }

        return this._snapshots;
    },

    hasSnapshots: function () {
        return this._getSnapshots().length > 0;
    },

    // Store a snapshot of this model's attributes and push the snapshot on a stack
    // This function eventually calls this object's toJSON function which will use the
    // defaultNesting attribute to determine how the object wil be serialized.
    createSnapshot: function () {
        var snapshot = this._buildSnapshot();
        this._getSnapshots().push(snapshot);
    },

    createAndReplaceLastSnapshot: function () {
        this._getSnapshots().pop();
        this.createSnapshot();
    },

    _buildSnapshot: function () {
        return this.toJSON();
    },

    restoreLastSnapshot: function () {
        var lastSnapshot = this._getSnapshots().pop();

        if (lastSnapshot) {
            this._restoreSnapshot(lastSnapshot);
        }
    },

    // Should be the inverse of _buildSnapshot
    _restoreSnapshot: function (snapshot) {
        this.set(snapshot, { unsetMissingAttributes: true });
    },

    hasChangedSinceLastSnapshot: function () {
        var lastSnapshot, currentSnapshot;

        lastSnapshot = _(this._getSnapshots()).last();

        if (!lastSnapshot) {
            return false;
        }

        Gryphon.domain.BaseModel._cleanJSONForSnapshotCompare(lastSnapshot);
        currentSnapshot = this._buildSnapshot();
        Gryphon.domain.BaseModel._cleanJSONForSnapshotCompare(currentSnapshot);
        return !Gryphon.domain.BaseModel.isJSONDeepEquals(lastSnapshot, currentSnapshot);
    },

    clearSnapshots: function () {
        this._snapshots = [];
    },

    _isCalculatedAttribute: function (attributeName) {
        return this._calculatedAttributeDefinitions && this._calculatedAttributeDefinitions[attributeName];
    }
    },

    //******************************************************************************************************************
    // Static fields and functions
    {
        HAS_A: 'HAS_A',
        OWNS_A: 'OWNS_A',
        SESSION: 'SESSION',

        // Make sure that the clazz's attribute definitions are properly initialized.
        // Makes sure the definitions look properly defined
        // Calculates the json serialization definitions and calculated attribute definitions
        initializeAttributeDefinitions: function (clazz) {
            var clazzPrototype, attributeName, definition, errorMessageContext, collectionClass;

            clazzPrototype = clazz.prototype;

            if (clazzPrototype.hasOwnProperty('_attributeDefinitions') && clazzPrototype._attributeDefinitions._initialized) {
                // The class prototype has already been initialized
                return;
            }

            // make sure the _attributeDefinitions exists
            if (!clazzPrototype.hasOwnProperty('_attributeDefinitions')) {
                clazzPrototype._attributeDefinitions = {};
            }

            clazzPrototype._attributeDefinitions._initialized = true;
            clazzPrototype._attributeDefinitions._jsonFormat = {};
            // You do not want this value to show up in any iterators
            Object.defineProperty(clazzPrototype._attributeDefinitions, '_initialized', { enumerable: false });
            Object.defineProperty(clazzPrototype._attributeDefinitions, '_jsonFormat', { enumerable: false });

            // Make sure the attribute definitions look correct and make sure the types can be located
            // Also build up the _jsonFormat structure
            for (attributeName in clazzPrototype._attributeDefinitions) {
                definition = clazzPrototype._attributeDefinitions[attributeName];

                errorMessageContext = ' attribute: \'' + attributeName + '\' context: ' + clazzPrototype.context;
                Gryphon.assert(_.isString(definition.type), 'A developer forgot to set the type property. ' + errorMessageContext);

                // Create a default relationship with type OWNS_A if the relationship was missing
                if (!definition.relationship) {
                    definition.relationship = { type: Gryphon.domain.BaseModel.OWNS_A };
                }

                Gryphon.assert(definition.relationship.type, 'A developer forgot to set the relationship.type' + errorMessageContext);

                // Look up the class type
                Gryphon.assert(GetContext('Gryphon.domain')[definition.type], 'The type you are trying to convert to does not exist.  It probably was not loaded yet. ' + errorMessageContext);
                definition._typeClass = GetContext('Gryphon.domain')[definition.type];

                if (definition.relationship.type === Gryphon.domain.BaseModel.HAS_A) {
                    Gryphon.assert(definition.relationship && definition.relationship.resolver, 'A developer forgot to set the relationship.resolver' + errorMessageContext);

                    if (definition.relationship.resolver !== Gryphon.domain.BaseModel.SESSION) {
                        Gryphon.assert(_.isFunction(definition.relationship.resolver), 'A developer forgot to correctly set the relationship.resolver' + errorMessageContext);
                    }
                }
                else if (definition.relationship.type === Gryphon.domain.BaseModel.OWNS_A) {
                    // Here you have to use the nested Classes' JSON format
                    clazzPrototype._attributeDefinitions._jsonFormat[attributeName] = Gryphon.domain.BaseModel.getJSONFormat(definition._typeClass);
                }
                else {
                    Gryphon.assert(false, 'Unknown relationship type ' + errorMessageContext);
                }
            }

            Gryphon.domain.BaseModel._initializeCalculatedAttributeDefinitions(clazzPrototype);
            Gryphon.domain.BaseModel._initializeModelUrlRoot(clazzPrototype);
        },

        // This performs a lot of validation on the calculated attribute definitions and it makes sure the calculated
        // attributes are excluded from the json representations of the models
        _initializeCalculatedAttributeDefinitions: function (clazzPrototype) {
            var clazzDefinitions, attributeName, calculatedDefinition;

            if (clazzPrototype._calculatedAttributeDefinitions) {
                clazzDefinitions = clazzPrototype._attributeDefinitions;

                if (!clazzDefinitions._jsonFormat.exclude) {
                    clazzDefinitions._jsonFormat.exclude = [];
                }

                for (attributeName in clazzPrototype._calculatedAttributeDefinitions) {
                    calculatedDefinition = clazzPrototype._calculatedAttributeDefinitions[attributeName];

                    // remove the calculated attribute from json serialization for this model
                    clazzDefinitions._jsonFormat.exclude.push(attributeName);

                    // sanity checks on the calculatedDefinition
                    Gryphon.assert(_.isArray(calculatedDefinition.dependencies), 'Calculated attributes should have a dependency of attribute names defined');
                    Gryphon.assert(_.isFunction(calculatedDefinition.calculation), 'Calculated attributes should have a calculation function defined');

                    // Validate the dependencies are strings
                    _.each(calculatedDefinition.dependencies, function (dependency) {
                        Gryphon.assert(_.isString(dependency), 'Dependencies for calculated attributes should be defined as strings');
                    });
                }
            }
        },

        // sbw todo - unit tests for this
        _initializeModelUrlRoot: function (clazzPrototype) {
            var collectionClazz;

            if (clazzPrototype.context && (collectionClazz = GetContext(clazzPrototype.context + 'Collection', false))) {
                if (collectionClazz.prototype.url) {
                    clazzPrototype.urlRoot = collectionClazz.prototype.url;
                }
            }
        },

        getJSONFormat: function (clazz) {
            var clazzPrototype;

            clazzPrototype = clazz.prototype;

            // Collections resolve to their corresponding model classes
            if (Gryphon.isClassOfType(clazz, Backbone.Collection)) {
                Gryphon.assert(clazzPrototype.model, 'Found a collection that had an undefined model');
                clazz = clazzPrototype.model;
                clazzPrototype = clazz.prototype;
            }

            // Check for defaultNesting for backwards compatibility.  When a V2 model owns-a unconverted BaseModel
            // we need to allow for the BaseModel to continue using it's defaultNesting until it can be upgraded
            // to the _attributeDefinitions format. Eventually this backdoor to defaultNesting should be closed.
            // JSON format only impacts how a model is converted to JSON, not when JSON is converted into models
            if (clazzPrototype.defaultNesting) {
                return clazzPrototype.defaultNesting;
            }
            else if (Gryphon.isClassOfType(clazz, Gryphon.domain.BaseModel)) {
                Gryphon.domain.BaseModel.initializeAttributeDefinitions(clazz);
                return clazzPrototype._attributeDefinitions._jsonFormat;
            }
            else {
                // Default to this - normally this in only called for owns -a relationships
                return {};
            }
        },

        _cleanJSONForMergeCompare: function (json) {
            Gryphon.deleteMatchingAttributes(json, Gryphon.domain.BaseModel._removeForMergeCompare);
        },

        _removeForMergeCompare: function (name, value) {
            return name === 'id' || name === 'cid' || value === '' || value === null || value === undefined;
        },

        _cleanJSONForSnapshotCompare: function (json) {
            Gryphon.deleteMatchingAttributes(json, Gryphon.domain.BaseModel._removeForSnapshotCompare);
        },

        // Almost the same as merge but ids are kept
        _removeForSnapshotCompare: function (name, value) {
            return name === 'cid' || value === '' || value === null || value === undefined;
        },

        // SHOULD ONLY BE CALLED FROM BaseModel
        // Unfortunately, _.isEqual does not properly handle the order of items in arrays.
        // For example, _.isEqual([{id: 2}, {id: 1}], [{id: 2}, {id: 1}]) returns false
        // I need an algorithm that is able to handle randomly ordered arrays.
        // Eagerly tries to find failures.  If no failures are found then success
        // This is only meant to work with JSON values, pass it anything else and who knows what it will return
        // This function also expects the JSON values of undefined, null or '' have all been recursively deleted
        isJSONDeepEquals: function (valA, valB) {
            var key, keyCount, otherKeyCount;

            if (!valA) {
                return !valB;
            }
            else if (!valB) {
                return !valA;
            }

            if (valA.constructor === Object) {
                if (valB.constructor !== Object) {
                    return false;
                }
                else {
                    keyCount = 0;
                    for (key in valA) {
                        if (valA.hasOwnProperty(key)) {
                            if (valA[key] && valA[key].constructor === Object || _.isArray(valA[key])) {
                                if (!Gryphon.domain.BaseModel.isJSONDeepEquals(valA[key], valB[key])) {
                                    return false;
                                }
                            }
                            else if (valA[key] !== valB[key]) {
                                return false;
                            }
                            keyCount++;
                        }
                    }

                    otherKeyCount = 0;
                    for (key in valB) {
                        if (valB.hasOwnProperty(key)) {
                            otherKeyCount++;
                        }
                    }

                    return keyCount === otherKeyCount;
                }
            }
            else if (_.isArray(valA)) {
                if (!_.isArray(valB)) {
                    return false;
                }
                else {
                    return Gryphon.domain.BaseModel._areJSONArraysDeepEqual(valA, valB);
                }
            }
            else {
                // assume at this point you are either at the end of the stack calls and no failures were found
                // or you were comparing 2 empty objects or arrays
                // no failures found
                return true;
            }
        },

        _areJSONArraysDeepEqual: function (arrA, arrB) {
            var aCount, arrACopy, valA, bCount, arrBCopy, valB, foundMatchInB;

            // It's assumed all null, undefined and '' were previously removed in the json being compared at this point

            if (arrA.length !== arrB.length) {
                return false;
            }
            else if (arrA.length === 0 && arrB.length === 0) {
                return true;
            }
            else {
                // Create shallow copies of the arrays that you can remove items from when you find matches
                arrACopy = arrA.slice();
                arrBCopy = arrB.slice();

                // for each model in A find a match in B. Remove matches found in both A and B
                for (aCount = 0; aCount < arrACopy.length; aCount++) {
                    valA = arrACopy[aCount];
                    foundMatchInB = false;

                    for (bCount = 0; bCount < arrBCopy.length; bCount++) {
                        valB = arrBCopy[bCount];
                        if (Gryphon.domain.BaseModel.isJSONDeepEquals(valA, valB)) {
                            foundMatchInB = true;
                            arrACopy.splice(aCount--, 1);
                            arrBCopy.splice(bCount--, 1);
                            break;
                        }
                    }

                    if (!foundMatchInB) {
                        return false;
                    }
                }

                return arrACopy.length === 0 && arrBCopy.length === 0;
            }
        }
    });