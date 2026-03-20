#include "tree_sitter/parser.h"
#include <stdbool.h>
#include <stdint.h>

enum TokenType {
  LONG_BRACKET,
};

void *tree_sitter_lua_external_scanner_create() { return NULL; }
void tree_sitter_lua_external_scanner_destroy(void *p) {}
unsigned tree_sitter_lua_external_scanner_serialize(void *p, char *buf) {
  return 0;
}
void tree_sitter_lua_external_scanner_deserialize(void *p, const char *buf,
                                                  unsigned n) {}

bool tree_sitter_lua_external_scanner_scan(void *payload, TSLexer *lexer,
                                           const bool *valid_symbols) {
  if (!valid_symbols[LONG_BRACKET])
    return false;

  // Must start with '['
  if (lexer->lookahead != '[')
    return false;
  lexer->advance(lexer, false);

  // Count opening '=' signs
  int level = 0;
  while (lexer->lookahead == '=') {
    level++;
    lexer->advance(lexer, false);
  }

  // Must be followed by another '['
  if (lexer->lookahead != '[')
    return false;
  lexer->advance(lexer, false);

  // Scan content until matching closing bracket
  while (!lexer->eof(lexer)) {
    if (lexer->lookahead == ']') {
      lexer->advance(lexer, false);

      int closing_level = 0;
      while (lexer->lookahead == '=') {
        closing_level++;
        lexer->advance(lexer, false);
      }

      if (closing_level == level && lexer->lookahead == ']') {
        lexer->advance(lexer, false);
        lexer->result_symbol = LONG_BRACKET;
        return true;
      }
    } else {
      lexer->advance(lexer, false);
    }
  }

  return false; // EOF without closing bracket
}
