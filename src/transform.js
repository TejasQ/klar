const { pascal } = require("case");

const transform = babel => {
  const { types: t } = babel;

  /**
   * Get a stored ObjectExpression's key from the AST.
   */
  const getKey = path => {
    // If we have an object property, awesome!
    if (t.isObjectProperty(path.parent)) {
      return pascal(path.parent.key.name);
    }

    // If not, keep going until we have an object property.
    if (path.parentPath) {
      return getKey(path.parentPath);
    }

    // Otherwise, fallback to a default.
    return "DEFAULT_TYPE";
  };

  /**
   * Let's store all ObjectExpressions here and then later
   * write them as interface/type definitions.
   */
  const objectCollection = {
    collection: {},
    add(object) {
      this.collection[getKey(object)] = object;
    },
  };

  return {
    visitor: {
      Program: {
        // After we've read the whole program,
        exit(path, { opts }) {
          if (!path.node.body[0]) {
            throw new Error(
              "Invalid data returned from the backend. Please check your resolve function, OR the actual URL.",
            );
          }
          /**
           * We end up replacing the whole program with a series
           * of interface/type assignments.
           *
           * Returned JSON from a web service is _not_ an assignment,
           * but something else: either an ArrayExpression or an
           * ObjectExpression.
           *
           * Based on this assumption, we can consider the program
           * ended if our program is an assignment expression.
           *
           * Contributions to do this better are _always_ welcome.
           */
          const programRewritten = t.isAssignmentExpression(
            path.node.body[0].expression,
          );

          if (programRewritten) {
            return;
          }

          // Replace the program with typedefs for each returned object.
          path.replaceWith(
            t.program(
              Object.entries(objectCollection.collection).map(collection => {
                const name = collection[0];
                const params = collection[1].node;

                return t.expressionStatement(
                  t.assignmentExpression(
                    "",
                    t.identifier(
                      `${opts.graphql ? "type" : "export interface"} ${pascal(
                        name === "DEFAULT_TYPE"
                          ? opts.rootType
                          : `${opts.prefix}${name}`,
                      )}`,
                    ),
                    params,
                  ),
                );
              }),
            ),
          );

          /**
           * Go through the program and replace all objects
           * with identifier references to their new extracted interfaces.
           *
           * It's important to do this _after_ we've rewritten the response,
           * hence the exit-specific visitor.
           */
          path.traverse({
            ObjectExpression: {
              exit(exitPath) {
                if (t.isAssignmentExpression(exitPath.parent)) {
                  return;
                }
                exitPath.replaceWith(t.identifier(getKey(exitPath)));
              },
            },
          });
        },
      },
      StringLiteral(path, { opts }) {
        path.replaceWith(t.identifier(opts.graphql ? "String" : "string"));
      },
      NumericLiteral(path, { opts }) {
        path.replaceWith(t.identifier(opts.graphql ? "Number" : "number"));
      },
      BooleanLiteral(path, { opts }) {
        path.replaceWith(t.identifier(opts.graphql ? "Boolean" : "boolean"));
      },
      ObjectProperty(path) {
        if (!t.isStringLiteral(path.node.key)) {
          return;
        }
        path.node.key = t.identifier(path.node.key.value); // eslint-disable-line
      },
      ObjectExpression: {
        enter(path) {
          /**
           * Our entire program rewrites objects to be type/interface assignments.
           * If this object has already been rewritten, do nothing.
           */
          if (path.parent.type === "AssignmentExpression") {
            return;
          }
          objectCollection.add(path);
        },
      },
      ArrayExpression(path, { opts }) {
        // Do nothing if we have an empty array whose type we can't infer.
        if (!path.node.elements[0]) {
          return;
        }
        switch (path.node.elements[0].type) {
          case "StringLiteral":
            path.replaceWith(
              t.identifier(opts.graphql ? "[String]" : "string[]"),
            );
            return;
          case "NumericLiteral":
            path.replaceWith(
              t.identifier(opts.graphql ? "[Number]" : "number[]"),
            );
            return;
          case "BooleanLiteral":
            path.replaceWith(
              t.identifier(opts.graphql ? "[Boolean]" : "boolean[]"),
            );
            return;
          case "Identifier":
            path.replaceWith(
              t.identifier(
                opts.graphql
                  ? `[${path.node.elements[0].name}]`
                  : `${path.node.elements[0].name}[]`,
              ),
            );
            break;

          default:
        }
      },
    },
  };
};

module.exports = transform;
