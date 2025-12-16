import sys
import json
import ply.lex as lex
import ply.yacc as yacc

# ======== Lexer ========
tokens = (
    'TYPE',
    'NAME',
    'ASSIGN',
    'NUMBER',
)

t_ASSIGN = r'←'

def t_TYPE(t):
    r'(整数型|文字列型)'
    return t

def t_NAME(t):
    r'[a-zA-Z_][a-zA-Z0-9_]*'
    return t

def t_NUMBER(t):
    r'\d+'
    t.value = int(t.value)
    return t

t_ignore = ' \t'

def t_error(t):
    print(f"Illegal character '{t.value[0]}'")
    t.lexer.skip(1)

lexer = lex.lex()

# ======== Parser ========
variables = {}

def p_statement_assign(p):
    '''statement : TYPE ':' NAME ASSIGN NUMBER'''
    var_type = p[1]
    var_name = p[3]
    var_value = p[5]
    variables[var_name] = var_value

def p_error(p):
    print("Syntax error", p)

parser = yacc.yacc()

# ======== Main ========
if __name__ == "__main__":
    for line in sys.stdin:
        parser.parse(line.strip(), lexer=lexer)
    print(json.dumps(variables, ensure_ascii=False))
