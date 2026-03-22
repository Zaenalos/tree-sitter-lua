#include "tree_sitter/parser.h"
#include <stdbool.h>
#include <stdint.h>

enum TokenType {
  LONG_STRING,
  LONG_COMMENT_BODY,
};

void *tree_sitter_lua_external_scanner_create() { return NULL; }
void tree_sitter_lua_external_scanner_destroy(void *p) { (void)p; }
unsigned tree_sitter_lua_external_scanner_serialize(void *p, char *buf) {
  (void)p;
  (void)buf;
  return 0;
}
void tree_sitter_lua_external_scanner_deserialize(void *p, const char *buf,
                                                  unsigned n) {
  (void)p;
  (void)buf;
  (void)n;
}

// Scan long bracket body after the opening [=*[ has been consumed.
// Returns true on successful close, false on EOF.
static bool scan_long_bracket_body(TSLexer *lexer, int level) {
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
        return true;
      }
    } else {
      lexer->advance(lexer, false);
    }
  }
  return false;
}

static int scan_opening_bracket(TSLexer *lexer) {
  if (lexer->lookahead != '[')
    return -1;
  lexer->advance(lexer, false);

  int level = 0;
  while (lexer->lookahead == '=') {
    level++;
    lexer->advance(lexer, false);
  }

  if (lexer->lookahead != '[')
    return -1;
  lexer->advance(lexer, false);
  return level;
}

bool tree_sitter_lua_external_scanner_scan(void *payload, TSLexer *lexer,
                                           const bool *valid_symbols) {
  (void)payload;

  if (valid_symbols[LONG_STRING]) {
    while (lexer->lookahead == ' ' || lexer->lookahead == '\t' ||
           lexer->lookahead == '\n' || lexer->lookahead == '\r') {
      lexer->advance(lexer, true);
    }

    lexer->mark_end(lexer);

    int level = scan_opening_bracket(lexer);
    if (level >= 0 && scan_long_bracket_body(lexer, level)) {
      lexer->mark_end(lexer);
      lexer->result_symbol = LONG_STRING;
      return true;
    }
    return false;
  }

  // =========================================================================
  // LONG_COMMENT_BODY: [=[...]=] for long comments.
  // Called after "--" has already been consumed by the grammar literal.
  // Does NOT skip whitespace — so "-- [[" (space before [) fails here
  // and falls back to the short comment regex in the grammar.
  // =========================================================================
  if (valid_symbols[LONG_COMMENT_BODY]) {
    lexer->mark_end(lexer);

    int level = scan_opening_bracket(lexer);
    if (level >= 0 && scan_long_bracket_body(lexer, level)) {
      lexer->mark_end(lexer);
      lexer->result_symbol = LONG_COMMENT_BODY;
      return true;
    }
    return false;
  }

  return false;
}
