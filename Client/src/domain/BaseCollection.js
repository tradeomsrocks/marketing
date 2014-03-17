GetNamespace('TradeOMS.domain').BaseCollection = Backbone.Collection.extend({

    toJSON: function(options) {
        if(!options){
            options = {};
        }
        // todo
        return TradeOMS.util.convertToJSON(this, options);
    },

    // Returns a new collection instance of the same type.
    // Pass this a filter function that takes a model and returns true or false
    // The new collection will contain references to all models where the filter returns true.
    createFilteredCollection: function(filter){
        var filteredCollection = new (this.constructor);
        var filteredModels = _.filter(this.models, filter);
        filteredCollection.reset(filteredModels);

        var binding = {};
        binding.filter = filter;
        binding.sourceCollection = this;
        binding.handlers = undefined;
        filteredCollection._binding = binding;

        _.extend(filteredCollection, this.FilteredCollectionMixin);

        filteredCollection.context = this.context + '[FILTERED_COLLECTION]';

        return filteredCollection;
    },

    // This mixin is to be used in conjunction with the createFilteredCollection function
    // It gives more functionality to a filtered collection, such as automatic binding to a source collection
    FilteredCollectionMixin: {
        // If you call this function you should probably also call the unbindFromSourceCollection once
        // you stop using the filtered collection so it doesn't become a useless zombie.
        bindToSourceCollection: function(options){
            var sourceCollection, handlers;

            if(this._binding.handlers !== undefined && this._binding.handlers !== null){
                this.unbindFromSourceCollection();
            }

            sourceCollection = this._binding.sourceCollection;
            handlers = {};

            handlers.addHandler = function(model){
                if(this.contains(model)){return;}
                if(this._binding.filter(model)){ this.add(model); }
            };
            sourceCollection.bind('add', handlers.addHandler, this);

            handlers.removeHandler = function(model){
                this.remove(model);
            };

            sourceCollection.bind('remove', handlers.removeHandler, this);

            handlers.resetHandler = function(){
                var filteredModels = _.filter(sourceCollection.models, this._binding.filter);
                this.reset(filteredModels);
            };
            sourceCollection.bind('reset', handlers.resetHandler, this);

            handlers.modelChangeHandler = function(model){
                if(this.contains(model)){
                    if(!this._binding.filter(model)){
                        this.remove(model);
                    }
                }
                else {
                    if(this._binding.filter(model)){
                        this.add(model, options);
                    }
                }
            };
            sourceCollection.bind('change', handlers.modelChangeHandler, this);

            handlers.sortHandler = function(){
                this.sort();
            };
            sourceCollection.bind('sort', handlers.sortHandler, this);

            this._binding.handlers = handlers;
            return this;
        },
        unbindFromSourceCollection: function(){
            var sourceCollection;

            if(this._binding && this._binding.handlers){
                sourceCollection = this._binding.sourceCollection;

                sourceCollection.unbind('add', this._binding.handlers.addHandler);
                sourceCollection.unbind('remove', this._binding.handlers.removeHandler);
                sourceCollection.unbind('reset', this._binding.handlers.resetHandler);
                sourceCollection.unbind('change', this._binding.handlers.modelChangeHandler);
                sourceCollection.unbind('sort', this._binding.handlers.sortHandler);
            }
        },

        updateFilter: function(newFilter, silent){
            var filteredModels;

            this._binding.filter = newFilter;

            filteredModels = _.filter(this._binding.sourceCollection.models, this._binding.filter);
            this.reset(filteredModels,{silent: !!silent});
        },

        reapplyFilter: function() {
            var oldModels = this.models;
            var newModels = _.filter(this._binding.sourceCollection.models, this._binding.filter);
            _(oldModels).chain().difference(newModels).each(function(model){
                this.remove(model);
            }, this);
            _(newModels).chain().difference(oldModels).each(function(model){
                this.add(model);
            }, this);
        }
    }
});


