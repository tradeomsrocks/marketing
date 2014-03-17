// Used to get a namespace seperated by '.'
// If create==true the namespace will be created if it doesn't exist
// Create is optional and will default to true.
// Useful for quickly creating namespaces to place a class or
// being able to get functions/objects defined in a namespace
function GetNamespace(namespacePath, create) {
    var namespaceItems, count, currentPath, namespace;

    if (namespacePath) {
        if (create === undefined) {
            create = true;
        }

        namespace = this; // will be the window
        namespaceItems = namespacePath.split('.');

        for (count = 0; count < namespaceItems.length; count++) {
            currentPath = namespaceItems[count];

            if (!namespace[currentPath]) {
                if (create) {
                    namespace[currentPath] = {};
                }
                else {
                    return undefined;
                }
            }

            namespace = namespace[currentPath];
        }

        return namespace;
    }
};