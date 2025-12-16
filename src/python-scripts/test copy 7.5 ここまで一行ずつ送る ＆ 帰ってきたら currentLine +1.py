import sys
import json
import ply.lex as lex
import ply.yacc as yacc

# run-pythonから送られた値を JSON形式の文字列から Pythonオブジェクトに変換する
source = json.loads(sys.stdin.read())
# code: エディタの文字列
code = source.get("code")
# variables: 現在の変数一覧
variables = source.get("variables")

# 正規化（例：全角コロンを半角コロンに変換）
code = code.replace('：', ':')

# Lexer (字句解析)

# トークン（単語の種類）一覧
tokens = ('TYPE', 'NAME', 'ASSIGN', 'NUMBER', 'COLON', 'PLUS', 'OUT', 'WO')

# PLY の字句解析ルール
def t_COLON(t):
    r':'                # 入力文字列から : を見つけると、この関数が呼び出される
    return t            # t トークンオブジェクト t.value に見つけた文字列

def t_ASSIGN(t):        # 代入
    r'←'
    return t

def t_PLUS(t):   # 加算　（テスト用）
    r'\+='
    return t

def t_TYPE(t):
    r'(整数型|文字列型|実数型)'       # ( | ) どれかに一致したら呼び出される
    return t

def t_NAME(t):                      # 1文字目は英字 or _ 2文字目以降は英字 or 数字 or _
    r'[a-zA-Z_][a-zA-Z0-9_]*'       # 1文字目 [a-zA-Z_] は 英字（a〜z または A〜Z）または _
    return t                        # 2文字目 [a-zA-Z0-9_]* の * は0以上の繰返し(1文字目のみも可能)

def t_NUMBER(t):
    r'\d+'                          # 1桁以上の整数 (\d は 0~9) (+ は 1文字以上の連続)
    t.value = int(t.value)          # 文字列 から 整数型に
    return t

def t_OUT(t):                       # 出力
    r'出力する'
    return t
def t_WO(t):                        # 助詞
    r'を'
    return t

t_ignore = ' 　\t\n\r'    # 無視する文字 半角・全角スペース, タブ, 改行, キャリッジリターン

# どのトークンルールにもマッチしなかった場合に呼び出される特別なエラーハンドラ
# t にはエラーが起きた時の、現在の位置情報や、文字情報を持つトークン風オブジェクトが入る
def t_error(t):
    # 標準エラー出力 (stderr) に、エラーの原因となった 文字列(t.value) を出力する
    print(f"字句解析エラー '{t.value}'", file=sys.stderr)   # f"" は {} の中の式・変数をその場で文字列に変換する
    # エラーの原因となった文字列(t.valueの桁)を全てスキップ
    t.lexer.skip(len(t.value))

# ここまで定義してきたトークンルールを使って、字句解析器（lexerオブジェクト）を作る
lexer = lex.lex()

# Parser (構文解析)

# 宣言して代入
def p_declaration_assign(p):
    # p[1]TYPE, p[2]COLON, p[3]NAME, p[4]ASSIGN, p[5]NUMBER
    'statement : TYPE COLON NAME ASSIGN NUMBER'
    # variablesの、キー(変数名)に、値(NUMBER)を入れる
    variables[p[3]] = p[5]

# 代入
def p_assign(p):
    'statement : NAME ASSIGN NAME'
    # NAME(代入される側) が variables に存在するか
    if p[1] in variables:
        # NAME(代入する側) が variables に存在するか
        if p[3] in variables:
            variables[p[1]] = variables[p[3]]
        else:
            # 未定義の変数"を"代入しようとした場合はエラー
            print(f"エラー: 変数 '{p[3]}' が未定義です", file=sys.stderr)
    else:
        # 未定義の変数"に"代入しようとした場合はエラー
        print(f"エラー: 変数 '{p[1]}' が未定義です", file=sys.stderr)


# 加算（変数名 += 数値）    （テスト用）
def p_plus(p):
    'statement : NAME PLUS NUMBER'
    # NAME が variables に存在するか
    if p[1] in variables:
        variables[p[1]] += p[3]
    else:
        # 未定義の変数に加算しようとした場合はエラー
        print(f"エラー: 変数 '{p[1]}' が未定義です", file=sys.stderr)

# 出力
def p_OUT(p):
    'statement : NAME WO OUT'
    # NAME が variables に存在するか
    outc = 1

    while f'出力{outc}' in variables :
        outc += 1

    if p[1] in variables:
        variables[f'出力{outc}' ] = p[1]
        
    else:
        # 未定義の変数"を"加算しようとした場合はエラー
        print(f"エラー: 変数 '{p[3]}' が未定義です", file=sys.stderr)


def p_error(p):
    # エラーを起こしたトークンと値を報告
    if p:
        print(f"構文エラー \"{p.type}\" ({p.value})", file=sys.stderr)
    # 構文が完成しないまま終了
    else:
        print("構文エラー: 構文が未完成", file=sys.stderr)

# paraserオブジェクト(構文解析器)の作成
parser = yacc.yacc()

# 実行
parser.parse(code)

# 出力
# variablesを文字列型(json)に変換して返す
# ensure_ascii=False : 非ASCII文字をエスケープしない（文字化け防止）
print(json.dumps(variables, ensure_ascii=False))
