# `index.test.ts`

**DO NOT MODIFY**. This file has been autogenerated. Run `rome test packages/@romejs/js-parser/index.test.ts --update-snapshots` to update.

## `typescript > class > property-optional-definite-assignment-not-allowed`

```javascript
Program {
  comments: Array []
  corrupt: false
  directives: Array []
  filename: 'input.ts'
  hasHoistedVars: false
  interpreter: undefined
  mtime: undefined
  sourceType: 'module'
  syntax: Array ['ts']
  loc: Object {
    filename: 'input.ts'
    end: Object {
      column: 0
      index: 27
      line: 4
    }
    start: Object {
      column: 0
      index: 0
      line: 1
    }
  }
  diagnostics: Array [
    Object {
      origins: Array [Object {category: 'js-parser'}]
      description: Object {
        category: 'parse/js'
        message: PARTIAL_BLESSED_DIAGNOSTIC_MESSAGE {value: 'Expected a semicolon or a line terminator'}
      }
      location: Object {
        filename: 'input.ts'
        mtime: undefined
        sourceType: 'module'
        end: Object {
          column: 4
          index: 14
          line: 2
        }
        start: Object {
          column: 4
          index: 14
          line: 2
        }
      }
    }
  ]
  body: Array [
    ClassDeclaration {
      id: BindingIdentifier {
        name: 'C'
        loc: Object {
          filename: 'input.ts'
          end: Object {
            column: 7
            index: 7
            line: 1
          }
          start: Object {
            column: 6
            index: 6
            line: 1
          }
        }
      }
      loc: Object {
        filename: 'input.ts'
        end: Object {
          column: 1
          index: 26
          line: 3
        }
        start: Object {
          column: 0
          index: 0
          line: 1
        }
      }
      meta: ClassHead {
        implements: undefined
        superClass: undefined
        superTypeParameters: undefined
        typeParameters: undefined
        loc: Object {
          filename: 'input.ts'
          end: Object {
            column: 1
            index: 26
            line: 3
          }
          start: Object {
            column: 0
            index: 0
            line: 1
          }
        }
        body: Array [
          ClassProperty {
            key: StaticPropertyKey {
              value: Identifier {
                name: 'x'
                loc: Object {
                  filename: 'input.ts'
                  end: Object {
                    column: 3
                    index: 13
                    line: 2
                  }
                  start: Object {
                    column: 2
                    index: 12
                    line: 2
                  }
                }
              }
              variance: undefined
              loc: Object {
                filename: 'input.ts'
                end: Object {
                  column: 3
                  index: 13
                  line: 2
                }
                start: Object {
                  column: 2
                  index: 12
                  line: 2
                }
              }
            }
            value: undefined
            definite: undefined
            typeAnnotation: undefined
            loc: Object {
              filename: 'input.ts'
              end: Object {
                column: 4
                index: 14
                line: 2
              }
              start: Object {
                column: 2
                index: 12
                line: 2
              }
            }
            meta: ClassPropertyMeta {
              abstract: false
              accessibility: undefined
              optional: true
              readonly: false
              static: false
              typeAnnotation: undefined
              start: Object {
                column: 2
                index: 12
                line: 2
              }
              loc: Object {
                filename: 'input.ts'
                end: Object {
                  column: 4
                  index: 14
                  line: 2
                }
                start: Object {
                  column: 2
                  index: 12
                  line: 2
                }
              }
            }
          }
          ClassProperty {
            key: StaticPropertyKey {
              value: Identifier {
                name: ''
                loc: Object {
                  filename: 'input.ts'
                  end: Object {
                    column: 5
                    index: 15
                    line: 2
                  }
                  start: Object {
                    column: 4
                    index: 14
                    line: 2
                  }
                }
              }
              variance: undefined
              loc: Object {
                filename: 'input.ts'
                end: Object {
                  column: 5
                  index: 15
                  line: 2
                }
                start: Object {
                  column: 4
                  index: 14
                  line: 2
                }
              }
            }
            value: undefined
            definite: undefined
            loc: Object {
              filename: 'input.ts'
              end: Object {
                column: 14
                index: 24
                line: 2
              }
              start: Object {
                column: 4
                index: 14
                line: 2
              }
            }
            typeAnnotation: NumberKeywordTypeAnnotation {
              loc: Object {
                filename: 'input.ts'
                end: Object {
                  column: 13
                  index: 23
                  line: 2
                }
                start: Object {
                  column: 7
                  index: 17
                  line: 2
                }
              }
            }
            meta: ClassPropertyMeta {
              abstract: false
              accessibility: undefined
              optional: false
              readonly: false
              static: false
              typeAnnotation: undefined
              start: Object {
                column: 4
                index: 14
                line: 2
              }
              loc: Object {
                filename: 'input.ts'
                end: Object {
                  column: 5
                  index: 15
                  line: 2
                }
                start: Object {
                  column: 4
                  index: 14
                  line: 2
                }
              }
            }
          }
        ]
      }
    }
  ]
}
```