import sys
import json
import ply.lex as lex
import ply.yacc as yacc

# run-pythonから送られた値を JSON形式の文字列から Pythonオブジェクトに変換する
source = json.loads(sys.stdin.read())
# エディタの文字列を取得
codes = source.get("codes")
# 現在の変数一覧を取得
globalVars = source.get("globalVars")
# 現在のグローバルスコープのステート
globalState = source.get("globalState")
# 現在の出力を取得
output = source.get("output")
# 次に実行する行を取得
currentLine = source.get("currentLine")
# 関数定義の情報を取得
functions = source.get("functions")
# 関数呼び出しの情報を取得
callStack = source.get("callStack")


# 実行前に関数の行番号などを登録する関数
def extract_functions(codes):
    function = {}
    i = 0
    n = len(codes)                      # 行数だから行番号より 1 多くなる
    while i < n:                        # 全ての行を実行まで
        line = codes[i].lstrip()        # 行頭のスペース削除
        if line.startswith('〇'):       # 〇で始まっているか
            start_function = i          # 関数定義の行
            start_process = i + 1       # 関数の処理１行目

            # 関数定義を名前と値に分けていく    〇function(整数型: a, 整数型: b)
            line = line[1:].strip()     # 〇を取り除く  function(整数型: a, 整数型: b) 
            params = []                 # 仮引数の配列を初期化
            name = None

            # 関数名と仮引数を取り出す
            if '(' in line and ')' in line:
                name = line.split('(', 1)[0].strip()                # function  返り値がある場合、 整数型 : function
                inside = line.split('(', 1)[1].split(')', 1)[0]     # 整数型: a, 整数型: b
                # 返り値がある場合 nameに入った 整数型:function からfunctionのみ取り出す
                if ':' in name:
                    name = name.split(':', 1)[1].strip()    # :の右側から空白カット

                # 仮引数が有るなら、追加していく
                if inside.strip() != "":                # ()の中身があるか確認

                    inside = inside.replace("：", ":")  # 全角コロンを半角に正規化

                    for p in inside.split(','):         # 中身を","で区切り、仮引数の数だけループ
                        ptype = p.split(":", 1)[0]      # 型
                        pname = p.split(":", 1)[1]      # 仮引数名
                        params.append({"type": ptype.strip(), "name": pname.strip()})        # 型と仮引数名を(前後の空白を取ってから)追加

            # 関数の終わりを探す
            j = start_process
            while j < n and not codes[j].lstrip().startswith('〇'):     # 最後の行まで & 次の関数が見つかるまで
                j += 1
            end_after = j  # 関数が終わって次の行　別の関数の〇 or 最後の行の次(無)）

            # 関数の情報を入れる
            if name:    # 関数を見つけていたら
                function[name] = {
                    "start_function": start_function,
                    "start_process": start_process,
                    "end_after": end_after,         # 関数が終わって次の行（次の関数の〇 or 最後の行の次）
                    "params": params,               # 仮引数名と型(辞書) 
                }

            i = j 
        else:
            i += 1
    return function

# 1行目実行時だけ関数を探して登録
if currentLine == 0:
    functions = extract_functions(codes)

# Lexer (字句解析)

# 記述ルール
# 左結合、乗除算優先
precedence = (
    ('left', 'PLUS', 'MINUS'),
    ('left', 'MULTI', 'DIVID'),
)

# 例外字句をまとめておく
reserved = {
    'return': 'RETURN',   # return は RETURN トークンにする
    'if': 'IF',
    'elseif': 'ELSEIF',
    'else': 'ELSE',
    'endif': 'ENDIF',
    'for': 'FOR',
    'while': 'WHILE',
    'do': 'DO'
}

# トークン（単語の種類）一覧
tokens = ('CIRCLE', 'TYPE', 'ARRAY', 'VALUE', 'END', 'NAME', 'NUMBER', 'COLON', 'EQUAL', 'NOT', 'LESS', 'GREATER', 'LESS_EQUAL', 'GREATER_EQUAL', 'ASSIGN', 'ADD',
        'PLUS','MINUS', 'MULTI', 'DIVID', 'SHOW', 'OUT', 'INCREASE', 'RESULT', 'ARR_LEN', 'WO', 'NO', 'NI', 'KARA', 'MADE', 'ZUTSU',  'L_S_BRACKET',
        'R_S_BRACKET', 'L_C_BRACKET', 'R_C_BRACKET', 'L_PAREN', 'R_PAREN', 'COMMA', 'RETURN', 'IF', 'ELSEIF', 'ELSE','ENDIF', 'FOR', 'WHILE', 'DO')

# PLY の字句解析ルール
# (入力文字列からトークンを見つけると、それぞれの関数が呼び出される)
def t_CIRCLE(t): # 関数定義
    r'〇'       
    return t

def t_TYPE(t):
    r'(整数型|文字列型|実数型)'       # ( | ) どれかに一致したら呼び出される
    return t

def t_ARRAY(t):
    r'配列'       
    return t

def t_VALUE(t):
    r'値'       
    return t


def t_END(t):
    r'末尾'       
    return t


def t_NAME(t):                      # 1文字目は英字 or _ 2文字目以降は英字 or 数字 or _
    r'[a-zA-Z_][a-zA-Z0-9_]*'       # 1文字目 [a-zA-Z_] は 英字（a〜z または A〜Z）または _
                                    # 2文字目 [a-zA-Z0-9_]* の * は0以上の繰返し(1文字目のみも可能)
    t.type = reserved.get(t.value, 'NAME')  # ← reservedに登録した例外字句なら、"NAME"typeではなくそちらに置き換える(無ければNAME)

    return t                        # 2文字目 [a-zA-Z0-9_]* の * は0以上の繰返し(1文字目のみも可能)

def t_NUMBER(t):
    r'\d+'                          # 1桁以上の整数 (\d は 0~9) (+ は 1文字以上の連続)
    t.value = int(t.value)          # 文字列 から 整数型に
    return t

def t_COLON(t):
    r'(:|：)'           
    return t                        # t トークンオブジェクト t.value に見つけた文字列

def t_EQUAL(t):                     # 一致
    r'='
    return t

def t_NOT(t):                       # 不一致
    r'\!'
    return t


def t_LESS(t):                      # より小さい
    r'\<'
    return t

def t_GREATER(t):                   # より大きい
    r'\>'
    return t

def t_LESS_EQUAL(t):                # 等しい　or 小さい
    r'≦'                           # 全角記号を使うと、エディタの動作が不安定になるため非推奨
    return t

def t_GREATER_EQUAL(t):             # 等しい　or 大きい
    r'≧'                           # 全角記号を使うと、エディタの動作が不安定になるため非推奨
    return t


def t_ASSIGN(t):                    # 代入
    r'←'
    return t

def t_ADD(t):                       # "追加する" (配列の末尾に)
    r'追加する'
    return t

def t_PLUS(t):                      # 加算
    r'\+'
    return t

def t_MINUS(t):                     # 減算
    r'\-'
    return t

def t_MULTI(t):                     # 乗算
    r'\×'
    return t

def t_DIVID(t):                     # 除算
    r'÷'
    return t

def t_SHOW(t):                     
    r'商'
    return t


def t_OUT(t):                       # 出力
    r'出力する'
    return t

def t_INCREASE(t):
    r'増やす'
    return t

def t_RESULT(t):
    r'結果'
    return t

def t_ARR_LEN(t):                   # 要素数
    r'要素数'
    return t


def t_WO(t):                        # 助詞
    r'を'
    return t

def t_NO(t):                        # 助詞
    r'の'
    return t

def t_NI(t):                        # 助詞
    r'に'
    return t

def t_KARA(t):
    r'から'
    return t

def t_MADE(t):
    r'まで'
    return t

def t_ZUTSU(t):
    r'ずつ'
    return t

    
def t_L_S_BRACKET(t):          # 左角括弧 Square Bracket
    r'\['
    return t

def t_R_S_BRACKET(t):          # 右角括弧 Square Bracket
    r'\]'
    return t

def t_L_C_BRACKET(t):          # 左波括弧 Curly Bracket
    r'\{'
    return t

def t_R_C_BRACKET(t):          # 右波括弧 Curly Bracket
    r'\}'
    return t

def t_L_PAREN(t):              # 左丸括弧 Parenthesis
    r'\('
    return t

def t_R_PAREN(t):              # 右丸括弧 Parenthesis
    r'\)'
    return t


def t_COMMA(t):                # カンマ
    r','
    return t


t_ignore = ' 　\t\n\r'      # 無視する文字 半角・全角スペース, タブ, 改行, キャリッジリターン

t_ignore_COMMENT = r'//.*'  # "//"以降の文字を無視して、コメントアウト  

# どのトークンルールにもマッチしなかった場合に呼び出される特別なエラーハンドラ
# t にはエラーが起きた時の、現在の位置情報や、文字情報を持つトークン風オブジェクトが入る
def t_error(t):
    # 標準エラー出力 (stderr) に、エラーの原因となった 文字列(t.value) を出力する
    print(f"字句解析エラー '{t.value}'", file=sys.stderr)   # f"" は {} の中の式・変数をその場で文字列に変換する
    # エラーの原因となった文字列(t.valueの桁)を全てスキップ
    t.lexer.skip(len(t.value))

# ここまで定義してきたトークンルールを使って、字句解析器（lexerオブジェクト）を作る
lexer = lex.lex()


# 汎用関数

# 関数が呼び出されているなら、最後に呼んだ関数からlocal変数の"""参照"""を返す
def latest_local():
    if callStack:                               # 呼び出されている
        return callStack[-1]["variables"]
    else:
        return None                             # 無いなら"None"を返す

# 変数がlocal, globalどちらに有るかを返す(local優先)
def find_scope(name):

    localvars = latest_local()   # 関数が呼び出されているならlocal変数の参照を取得

    # 探している変数がlocal, globalどちらに有るかの判定
    if localvars is not None and name in localvars:   # 関数が呼び出されている＆local変数内で見つかる
        return 'local'
    elif name in globalVars:                          # globalで見つかる
        return 'global'
    else:
        return None

# if文中で既にif, elseifのどれかに入っているかを返す
def if_Entered():
    entered = False             # 既に条件を満たして入っているか
    
    if callStack:                                   # callStackがある時点でグローバルは参照しなくていい
        if callStack[-1]["ifStack"]:                # if文を実行中
            ifState = callStack[-1]["ifStack"][-1]
            if ifState["if_Entered"]:                    # ifの条件を満たして入っていた
                entered = True
    else:                                           # 関数が呼び出されてない
        if globalState["ifStack"]:                  # if文を実行中
            ifState = globalState["ifStack"][-1]
            if ifState["if_Entered"]:                    # ifの条件を満たして入っていたか
                entered = True
    
    return entered



# if文中で次に飛ばす行を返す    elif か elseif か endif  (ifの条件を満たさず、ジャンプする行を探す時のみ呼び出される)
def if_nextline(start_line):

    depth = 0               # ネストの深さ (if中でelseifなどを探しているときにifを見つけたらendifまで無視するため)
    i = start_line + 1      # 次の行から
    n = len(codes)
    entered = if_Entered()  # 既にif, elseifに入っていたか取得

    # 既にif, elseifに入っていたら、elseif, elseには入らせない
    # if文のネストに入ったら、endifでネストを抜けるまでスキップさせる
    while i < n:                            # 全ての行を越えない  (保険)
        code = codes[i].lstrip()            # 次に見る行から空白を取り除く
        if code.startswith('if'):           # 別のif文 (スキップ中にネストに入った) 
            depth += 1                      # depthが1以上ならスキップ中なのでend ifまでスルー
        elif code.startswith('elseif') and depth == 0 and entered != True:      # elseif(ネスト内でない) & ifの条件をまだ満たしてない
            nextline = i                                    # elseif判定のため、そのままの行に飛ばす
            break
        elif code.startswith('else') and depth == 0 and entered != True:        # else(ネスト内でない) & ifの条件をまだ満たしてない
            nextline = i
            break
        elif code.startswith('endif'):                      # endif
            if depth == 0:             # ネスト内でない
                nextline = i + 1       # if文終了
                break
            depth -= 1                 # ネスト内だったら抜ける

        i += 1

    return nextline

# インデント数を返す (行番号を渡して呼ぶ)
def indent_count(line_number): 

    line = codes[line_number]               # 確認する行を取得

    stripped = line.lstrip()                # インデントを除く
    len_line = len(line)                    # インデント + 元の文
    len_stripped = len(stripped)               # インデントを除いたもの
    indent = len_line - len_stripped        # (元 - インデントを除いたもの) = インデント数

    return indent
    
# Parser (構文解析)

# 空白行
def p_blank(p):
    'statement :'
    pass


# 宣言 同時に複数も可能     整数型: a, b, c
def p_declaration(p):
    'statement : TYPE COLON decl_names'

    localvars = latest_local()                      # 関数が呼び出されているならlocal変数の参照を取得
    names_list = p[3]                               # 宣言する変数名たち(辞書)
    
    # variablesの、キー(変数名)に初期化
    if localvars is not None:                       # 関数が呼び出されている
        for name in names_list: 
            localvars[name] = {                     # localに宣言
                "value": "未定義",
                "kind": "scalar"
            }
    else:                                           # 関数が呼び出されてない
        for name in names_list:
            globalVars[name] = {                    # globalに宣言
                "value": "未定義",
                "kind": "scalar"
            }
            

# 宣言する変数をnamesにまとめる
def p_decl_names_f(p):                          # 宣言する一つ目の変数名
    'decl_names : NAME decl_names_m'            # 後ろのdecl_names_mに二つ目以降を加える(無ければ空)
    p[0] = [p[1]] + p[2]  

def p_decl_names_more(p):                       # 宣言する二つ目以降の変数名
    'decl_names_m : COMMA NAME decl_names_m'    # 後ろのdecl_names_mに三つ目以降の引数(無なら空)を加える
    p[0] = [p[2]] + p[3]

def p_decl_names_end(p):                        # 変数名の後に何もなければ空にして終了
    'decl_names_m : '
    p[0] = []


#宣言して代入
def p_declaration_assign(p):
    # p[1]TYPE, p[2]COLON, p[3]NAME, p[4]ASSIGN, p[5]value
    'statement : TYPE COLON NAME ASSIGN value'

    name = p[3]
    value = p[5]

    localvars = latest_local()   # 関数が呼び出されているならlocal変数の参照を取得

    # variablesの、キー(変数名)に、値(value)を入れる 
    if localvars is not None:                   # 関数が呼び出されている
        localvars[name] = {                     # localに宣言
            "value": value,
            "kind": "scalar"
        }
    else:                                       # 関数が呼び出されてない
        globalVars[name] = {                    # globalに宣言
            "value": value,
            "kind": "scalar"
        }
        

# 代入
def p_assign(p):
    'statement : NAME ASSIGN value'

    name = p[1]
    value = p[3]

    localvars = latest_local()
    name_scope = find_scope(name)            # 代入される側がlocal, globalどちらに有るかを取得(local優先)
    
    # 代入処理
    if name_scope == 'local':       # 代入される側が local にある
        localvars[name]["value"] = value
    elif name_scope == 'global':    # 代入される側が global にある
        globalVars[name]["value"] = value
    else:                           # None (未定義の変数に代入しようとした場合はエラー)
        print(f"エラー: 変数 '{name}' が未定義です", file=sys.stderr)



# 配列

# 配列を宣言して代入    (宣言時は波括弧　{} {1} {1,2,3})   入ってない、一つだけ、複数
def p_declaration_assign_array(p):
    # 整数型    の       配列       :           name       ←        　{1,2,3}
    # p[1]TYPE, p[2]NO, p[3]ARRAY, p[4]COLON, p[5]NAME, p[6]ASSIGN, p[7]init_array
    'statement : TYPE NO ARRAY COLON NAME ASSIGN init_array'

    name = p[5]
    value = p[7]                   # 代入するPythonのリスト
    localvars = latest_local()

    # variablesの、キー(変数名)に、初期値(init_array)を入れる
    if localvars is not None:        # 関数が呼び出されている
         localvars[name] = {         # localに宣言
            "value": value,
            "kind": "array"
        }
    else:                            # 関数が呼び出されてない
        globalVars[name] = {         # globalに宣言
            "value": value,
            "kind": "array"
        }
        

# 配列に入れる初期値 init_array

def p_init_array_empty(p):    #  { } 配列の初期値が空
    'init_array : L_C_BRACKET R_C_BRACKET'
    p[0] = []
    
def p_init_array(p):    # 　　{　　　　1,2,3　　　　}　宣言した配列に入れる初期値
    'init_array : L_C_BRACKET init_array_val R_C_BRACKET'
    p[0] = p[2]  # 中のリストを返す

# 配列に入れる初期値の要素　init_array_val

def p_init_array_num_multi(p):  # 1, 2, 3 配列に入れる初期値が複数
    #                     　　　　　　　　　　値が3つ以上の時、右に ｝が来るまで ↓ を繰り返す
    #                                          init_array_val  COMMA   NUMBER
    'init_array_val : init_array_val COMMA NUMBER'  # 1,2       ,     3
    # 配列のリストに加える
    p[0] = p[1] + [p[3]]

def p_init_array_num_single(p): 
    'init_array_val : NUMBER'
    # 配列のリストに
    p[0] = [p[1]]


# 配列の要素番号を指定して代入 (配列に代入)
# array[i] ← value
def p_assign_array(p):
    # p[1]NAME, p[3]要素番号のvalue, p[6]代入するvalue
    'statement : NAME L_S_BRACKET value R_S_BRACKET ASSIGN value'

    arrname = p[1]
    number = p[3] - 1                   # 疑似言語では要素番号が1から始まるから、pythonでは -1 
    value = p[6]

    localvars = latest_local()
    scope = find_scope(arrname)

    # 代入処理
    if scope == 'local':                # 代入される側が local にある
        localvars[arrname]["value"][number] = value
    elif scope == 'global':             # 代入される側が global にある
        globalVars[arrname]["value"][number] = value
    else:                               # None (未定義の変数に代入しようとした場合はエラー)
        print(f"エラー: 配列 '{arrname}' が未定義です", file=sys.stderr)    


# 配列の末尾に追加
def p_add_end_of_array(p):
    #p[1]追加される配列のNAME, p[5]追加する値のvalue
    'statement : NAME NO END NI value WO ADD'
    
    array_name = p[1]
    value = p[5]

    localvars = latest_local()
    scope = find_scope(array_name)

    # 追加処理
    if scope == 'local':                # 代入される側が local にある
        localvars[array_name]["value"].append(value)
    elif scope == 'global':             # 代入される側が global にある
        globalVars[array_name]["value"].append(value)
    else:                               # None (未定義の変数に代入しようとした場合はエラー)
        print(f"エラー: 配列 '{array_name}' が未定義です", file=sys.stderr)    


# 出力  'valueを出力する'
def p_out(p):
    'statement : value WO OUT'
    
    value = p[1]
    outc = 1

    while f'出力{outc}' in output :  # outputに既に 出力1,2...が存在していたら見つからなくなるまで、outcを増やす
        outc += 1

    output[f'出力{outc}' ] = value   # 出力に値を入れる


# 関数定義    〇function(整数型: a, 整数型: b)

# 仮引数を"params"にまとめる    (関数定義のスキップに使うだけ)
def p_params_f_empty(p):                    # 仮引数に一つも入ってない
    'params : '
    p[0] = []

def p_params_f(p):                                  # 一つ目の引数
    'params : TYPE COLON NAME params_m'             # 後ろのparams_mに二つ目以降の引数(無なら空)を加える
    p[0] = [p[3]] + p[4]

def p_params_f_array(p):                            # 一つ目の引数(配列)
    'params : TYPE NO ARRAY COLON NAME params_m'    # 後ろのparams_mに二つ目以降の引数(無なら空)を加える
    p[0] = [p[5]] + p[6]

def p_params_more(p):                               # 二つ目以降の引数
    'params_m : COMMA TYPE COLON NAME params_m'     # 後ろのparams_mに三つ目以降の引数(無なら空)を加える
    p[0] = [p[4]] + p[5]

def p_params_more_array(p):                         # 二つ目以降の引数(配列)
    'params_m : COMMA TYPE NO ARRAY COLON NAME params_m'     # 後ろのparams_mに三つ目以降の引数(無なら空)を加える
    p[0] = [p[6]] + p[7]

def p_params_end(p):                                # 引数の後に何もなければ、params_mを空にして、終了
    'params_m : '
    p[0] = []


# 関数定義(〇)に来た時のスキップ
def p_function_def(p):
    'statement : CIRCLE NAME L_PAREN params R_PAREN'
    info = functions.get(p[2])
    if info:                               # 呼び出した名前の関数が定義されていたら
        p.parser.jump = info['end_after']  # 飛ばす行の値を"jump"に入れる

# 関数定義(返り値有り)に来た時のスキップ
def p_function_def_ret_val(p):
    'statement : CIRCLE TYPE COLON NAME L_PAREN params R_PAREN'
    info = functions.get(p[4])
    if info:                               # 呼び出した名前の関数が定義されていたら
        p.parser.jump = info['end_after']  # 飛ばす行の値を"jump"に入れる

# 関数定義(配列の返り値有り)に来た時のスキップ
def p_function_def_ret_array(p):
    'statement : CIRCLE TYPE NO ARRAY COLON NAME L_PAREN params R_PAREN'
    info = functions.get(p[6])
    if info:                               # 呼び出した名前の関数が定義されていたら
        p.parser.jump = info['end_after']  # 飛ばす行の値を"jump"に入れる




# 関数の呼び出し    function(a, b)

# 関数呼び出しの引数をargsにまとめる
def p_args_f_empty(p):
    'args : '                           # 引数に一つも入ってない
    p[0] = []

def p_args_f(p):                        # 一つ目の引数
    'args : value args_m'               # 後ろのargs_mに二つ目以降の引数(無なら空)を加える
    p[0] = [p[1]] + p[2]

def p_args_more(p):                     # 二つ目以降の引数
    'args_m : COMMA value args_m'       # 後ろのargs_mに三つ目以降の引数(無なら空)を加える
    p[0] = [p[2]] + p[3]

def p_args_end(p):                      # 引数の後に何もなければ、args_mを空にして終了
    'args_m : '
    p[0] = [] 


# 関数呼び出し処理
def p_function_call(p):
    'statement : NAME L_PAREN args R_PAREN'

    name = p[1]
    info = functions.get(name)                  # 呼び出す関数名から情報を取得

    if info:                                    # 呼び出した名前の関数が定義されていたら
        params = info.get('params', [])         # 仮引数を取得
        args_list = p[3]                        # 実引数のリスト


    # "仮引数名": { "value": 実引数, "kind": array } の形で新しいlocal変数を用意
    new_local = {}  # callStackをpushしてから、新しいlocal変数に引数を入れるために、仮の辞書を用意
    
    for idx, param in enumerate(params):        # インデックスと仮引数を同時取得してループ
        pname = param["name"]                   # 仮引数名
        ptype = param["type"]                   # "整数型", "整数型の配列" など

        value = args_list[idx]

        # ptypeに"配列"が含まれていたら配列として扱う
        if "配列" in ptype:
            kind = "array"
        else:
            kind = "scalar"

        new_local[pname] = {
            "value": value,
            "kind": kind
        }

    p.parser.funcName = name
    p.parser.new_local = new_local
    p.parser.returnLine = currentLine + 1   # 呼び出した位置の次を保持(処理が終わったら飛ばす)
    p.parser.endLine = info["end_after"]    # 呼び出した関数の終了位置(終了して次の行)
    p.parser.jump = info['start_process']   # 関数の処理に飛ばす


# 関数の戻り値を代入   x ← func()      func()の戻り値を～～～という書き方に変更の必要あり？
def p_assign_func_call(p):
    'statement : NAME ASSIGN NAME L_PAREN args R_PAREN'

    name = p[1]                     # 代入先    x      
    f_name = p[3]                   # 関数名    function
    info = functions.get(f_name)    # 関数の情報
    scope = find_scope(name)        # 代入先のスコープ("local"か"global")
    
    # 代入先の参照を取得
    scope_ref = {}                  # 代入先の参照

    if scope == 'local':            # 代入される側が local にある
        scope_ref = latest_local()
    elif scope == 'global':         # 代入される側が global にある
        scope_ref = "global"
    else:                           # None (未定義の変数に代入しようとした場合はエラー)
        print(f"エラー: 変数 '{name}' が未定義です", file=sys.stderr)


    if info:                                    # 呼び出した名前の関数が定義されていたら
        params = info.get('params', [])         # 仮引数を取得
        args_list = p[5]

    # "仮引数名": { "value": 実引数, "kind": array } の形で新しいlocal変数を用意
    new_local = {}  # callStackをpushしてから、新しいlocal変数に引数を入れるために、仮の辞書を用意
    
    for idx, param in enumerate(params):        # インデックスと仮引数を同時取得してループ
        pname = param["name"]                   # 仮引数名
        ptype = param["type"]                   # "整数型", "整数型の配列" など

        value = args_list[idx]

        # ptypeに"配列"が含まれていたら配列として扱う
        if "配列" in ptype:
            kind = "array"
        else:
            kind = "scalar"

        new_local[pname] = {
            "value": value,
            "kind": kind
        }

    p.parser.funcName = f_name
    p.parser.new_local = new_local
    p.parser.returnLine = currentLine + 1   # 呼び出した位置の次を保持(処理が終わったら飛ばす)
    p.parser.endLine = info["end_after"]    # 呼び出した関数の終了位置(終了して次の行)
    p.parser.jump = info['start_process']   # 
    p.parser.funcAction = {          # 関数をどう使うかの情報
        "type": "assign",            # return後に代入を行う
        "name": name,                # 代入先変数名
        "scope": scope,              # "local"か"global"
        "scope_ref": scope_ref       # local変数の参照 or "global"
    }


# 変数の宣言と同時に関数の戻り値を代入  整数型: x ← func()      func()の戻り値を～～～という書き方に変更の必要あり？
def p_declaration_func_call(p):
    'statement :  TYPE COLON NAME ASSIGN NAME L_PAREN args R_PAREN'

    name = p[3]                     # 代入先    x     
    localvars = latest_local()      # 関数が呼び出されているならlocal変数の参照を取得 
    f_name = p[5]                   # 関数名    function
    info = functions.get(f_name)    # 関数の情報

    # 宣言
    # variablesの、キー(変数名)に初期化
    if localvars is not None:                   # 関数が呼び出されている
        localvars[name] = {                     # localに宣言
            "value": "未定義",
            "kind": "scalar"
        }
        scope = "local"
        scope_ref = localvars
    else:                                       # 関数が呼び出されてない
        globalVars[name] = {                    # globalに宣言
            "value": "未定義",
            "kind": "scalar"
        }
        scope = "global"
        scope_ref = "global"
    
    # 代入先の参照を取得

    if info:                                    # 呼び出した名前の関数が定義されていたら
        params = info.get('params', [])         # 仮引数を取得
        args_list = p[7]

    # "仮引数名": { "value": 実引数, "kind": array } の形で新しいlocal変数を用意
    new_local = {}  # callStackをpushしてから、新しいlocal変数に引数を入れるために、仮の辞書を用意
    
    for idx, param in enumerate(params):        # インデックスと仮引数を同時取得してループ
        pname = param["name"]                   # 仮引数名
        ptype = param["type"]                   # "整数型", "整数型の配列" など

        value = args_list[idx]

        # ptypeに"配列"が含まれていたら配列として扱う
        if "配列" in ptype:
            kind = "array"
        else:
            kind = "scalar"

        new_local[pname] = {                    
            "value": value,
            "kind": kind
        }

    p.parser.funcName = f_name
    p.parser.new_local = new_local
    p.parser.returnLine = currentLine + 1   # 呼び出した位置の次を保持(処理が終わったら飛ばす)
    p.parser.endLine = info["end_after"]    # 呼び出した関数の終了位置(終了して次の行)
    p.parser.jump = info['start_process']   # 
    p.parser.funcAction = {          # 関数をどう使うかの情報
        "type": "assign",            # return後に代入を行う
        "name": name,                # 代入先変数名
        "scope": scope,              # "local"か"global"
        "scope_ref": scope_ref       # local変数の参照 or "global"
    }   


# 関数のreturn(返り値無し)
def p_return(p): 
    'statement : RETURN'

    # returnしたことを知らせる
    p.parser.ret = True


# 関数のreturn(返り値有り)
def p_return_val(p): 
    'statement : RETURN value'
    value = p[2]
    
    # return
    p.parser.ret = True         # returnしたことを知らせる
    p.parser.retValue = value   # 返り値を保持


def p_if(p):    # if (n = 0)
    # p[1]IF, p[2]L_PAREN, p[3]conditional, p[4]R_PAREN
    'statement : IF L_PAREN conditional R_PAREN'
       
    p.parser.newIf = True                           # 新しいif文に入った
    if p[3] == True:                                # if文の条件を満たして入った
        p.parser.if_Entered = True                  # 入ったことを保持して、行はそのまま
    else:                                           # if文の条件を満たさなかった
        p.parser.if_skip = True                     # 次のelseifかelseかendifまで飛ばす


def p_elseif(p):    # elseif (n = 1)
    # p[1]ELSEIF, p[2]L_PAREN, p[3]conditional, p[4]R_PAREN
    'statement : ELSEIF L_PAREN conditional R_PAREN'

    entered = if_Entered()
    if (p[3] == True) and entered != True:          # elseifの条件を満たした ＆ まだほかのif,elseifに入っていない
        p.parser.if_Entered = True                  # 入ったことを保持して、行はそのまま
    else:                                           # elseif文の条件を満たさなかった or 既にif, elseifに入っていた 
        p.parser.if_skip = True                     # 次のelseifかelseかendifまで飛ばす

def p_else(p):    # else
    # p[1]ELSE
    'statement : ELSE'

    entered = if_Entered()
    if entered != True:                             # まだif, elseifどこにも入ってないなら
        p.parser.if_Entered = True                  # 入ったことを保持して、行はそのまま
    else:                                           # 既にif, elseifどこかに入っていたら
        p.parser.if_skip = True                     # endifまで飛ばす

def p_endif(p): # endif
    # p[1]ENDIF
    'statement : ENDIF'

    p.parser.if_End = True                          # if文終了


# 条件式 (結果も入れて渡す True or False)
def p_conditional(p):   # 条件式  n = 0
    'conditional : value sign value'

    valuea = p[1]
    sign = p[2]
    valueb = p[3]

    # 記号ごとに判定して conditional に式の結果を入れる
    if sign == "=":             # 等しい
        if valuea == valueb:
            p[0] = True
        else: 
            p[0] = False
    elif sign == "!=":          # 等しくない
        if valuea != valueb:
            p[0] = True
        else: 
            p[0] = False
    elif sign == "<":           # より小さい
        if valuea < valueb:
            p[0] = True
        else: 
            p[0] = False
    elif sign == "<=":          # 等しい or 小さい
        if valuea <= valueb:
            p[0] = True
        else: 
            p[0] = False
    elif sign == ">":           # より大きい
        if valuea > valueb:
            p[0] = True
        else: 
            p[0] = False
    elif sign == ">=":           # 等しい or 大きい
        if valuea >= valueb:
            p[0] = True
        else: 
            p[0] = False
    
    

# sign に記号をまとめる
def p_equal(p):                 # 等しい 
    'sign : EQUAL'

    p[0] = "="

def p_not_equal(p):             # 等しくない 
    'sign : NOT EQUAL'

    p[0] = "!="


def p_less(p):                  # より小さい 
    'sign : LESS'

    p[0] = "<"

def p_or_less(p):               # 等しい or 小さい 
    'sign : LESS EQUAL'         # <=

    p[0] = "<="

def p_or_less2(p):              # 等しい or 小さい 
    'sign : LESS_EQUAL'         # ≦                 この記号を使うと、エディタの動作がおかしくなるから非推奨

    p[0] = "<="


def p_greater(p):               # より大きい
    'sign : GREATER'

    p[0] = ">"

def p_or_greater(p):            # 等しい or 大きい 
    'sign : GREATER EQUAL'      # >=

    p[0] = ">="

def p_or_greater2(p):           # 等しい or 大きい 
    'sign : GREATER_EQUAL'      # ≧                 この記号を使うと、エディタの動作がおかしくなるから非推奨

    p[0] = ">="



# for文 
# 条件を満たさなくなったら、endfor+1に飛ばして、stateをpop
# 一回目はstateが作られてないから、直接参照する必要がある
# カウンタ変数はあらかじめ宣言してある想定

def p_for(p):    # for (i を 1 から 5 まで 1 ずつ 増やす)
    # p[1]FOR, p[2]L_PAREN, p[3]NAME, p[4]WO, p[5]value, p[6]KARA, p[7]value, p[8]MADE, p[9]NUMBER, p[10]ZUTSU, p[11]INCREASE, p[12]R_PAREN
    'statement : FOR L_PAREN NAME WO value KARA value MADE NUMBER ZUTSU INCREASE R_PAREN'
    cntname = p[3]      # カウンタ変数名
    initval = p[5]      # 初期値
    #condition1 = p[6]   # "から" or 
    endval = p[7]       # 終了条件
    condition2 = p[8]   # "まで" or
    chanval = p[9]      # 再設定(増減値)
    chantype = p[11]      # "増やす" or "減らす"

    localvars = latest_local()
    
    # このfor文を実行していなかったら、stateを追加。　していたら、for文に来たということのみを知らせる
    new = True      # 既に実行しているfor文かどうか 
    if localvars is not None:                           # 関数が呼び出されているなら(ローカル)
        if callStack[-1].get("forStack"):                   # for文を実行中なら
            forState = callStack[-1]["forStack"][-1]
            if currentLine == forState["startLine"]:    # 現在の行が今実行しているfor文の始まりかどうか
                new = False                             # 既にループ中なのでステートは追加しない
    else:                                               # 関数が呼び出されていない(グローバル)
        if globalState.get("forStack"):                     # for文を実行中なら
            forState = globalState["forStack"][-1]
            if currentLine == forState["startLine"]:    # 現在の行が今実行しているfor文の始まりかどうか
                new = False                             # 既にループ中なのでステートは追加しない

    # 新しいfor文ならステートを追加する
    if new == True:
        # stateに渡したいもの
        # forの行 (戻すため)    & currentLineと比較して、新しいfor文かどうかを判定
        # endforの行 (終了したら飛ばしたい)(ループのたびにendforの行にはいきたくないから、currentLineがendforなら戻す処理を最後に入れる)
        # カウンタ変数     名前、スコープ         
        # 終了条件         値、　式の種類(=, <, <=)
        # 再設定           値、 増減
        # for文に来たという判定、　for文の行を使って、どのfor文かも判定？


        # endforの行を取得
        depth = 0               # ネストの深さ (endforを探しているときにforを見つけたら元のforのendforまで無視するため)
        i = currentLine + 1      # 次の行から
        n = len(codes)        
        # for文のネストに入ったら、endforでネストを抜けるまでスルーさせる
        while i < n:            # 全ての行を越えない  (保険)
            code = codes[i].lstrip()            # 次に見る行から空白を取り除く
            if code.startswith('for'):          # 別のfor文 (ネストに入った) 
                depth += 1                      # depthが1以上ならスキップ中なのでend forまでスルー
            elif code.startswith('endfor'):     # endfor
                if depth == 0:                  # ネスト内でない
                    endline = i                 
                    break
                depth -= 1                      # ネスト内だったら抜ける
            i += 1

        # カウンタ変数のスコープを取得
        cntname_scope = find_scope(cntname)      # カウンタ変数がlocal, globalどちらに有るかを取得(local優先)
        # カウンタ変数の初期設定
        if cntname_scope == 'local':       # カウンタ変数が local にある
            localvars[cntname]["value"] = initval
        elif cntname_scope == 'global':    # カウンタ変数が global にある
            globalVars[cntname]["value"] = initval
        else:                           # None (未定義の変数に代入しようとした場合はエラー)
            print(f"エラー: 変数 '{cntname}' が未定義です", file=sys.stderr)

        # 終了条件
        if condition2 == "まで":            # "まで" なら以上 or 以下
            if chantype == "増やす":        # 以下
                endtype = "or_under"
            elif chantype == "減らす":      # 以上
                endtype = "or_over"

        # 渡す
        p.parser.for_Entered = "new"                                # for文に来たことを知らせる(1回目)
        p.parser.startLine = currentLine                            # for文の始まり
        p.parser.endLine = endline                                  # endfor
        p.parser.cntName = cntname                                  # カウンタ変数名
        p.parser.cntScope = cntname_scope                           # カウンタ変数のスコープ("local" or "global")
        p.parser.endValue = endval                                  # 終了条件の値
        p.parser.endType = endtype                                  # or_under, or_over,
        p.parser.changeValue = chanval                              # 増減値   直で使えるからいらない？
        p.parser.changeType = chantype                              # "増やす" or "減らす"
    
    else:                   # ループ2回目以降
        p.parser.for_Entered = "loop"                       # # for文に来たことを知らせる(2回目以降)


# endforには来ない想定だがスキップを実装しておく？


# while文
# whileの始まり or do whileの終わり

# while
# 条件を満たさなくなったら、endwhile+1に飛ばして、stateをpop
# 一回目はstateが作られてないから、直接参照する必要がある
def p_while(p):  # while (low <= high)
    
    'statement : WHILE L_PAREN conditional R_PAREN'

    condition = p[3]
    localvars = latest_local()

    # whileかdo whileかを判定
    # doに入ったらstateに終わりのwhile行を登録、それと一致したらdoのwhileとして処理

    iswhile = "while"                                      
    if localvars is not None:                               # 関数が呼び出されているなら(ローカル)
        if callStack[-1].get("dowhileStack"):               # while文を実行中なら
            dowhileState = callStack[-1]["dowhileStack"][-1]
            if currentLine == dowhileState["endLine"]:      # 現在の行が今実行しているdowhile文の終わりかどうか
                iswhile = "dowhile"                         
    else:                                                   # 関数が呼び出されていない(グローバル)
        if globalState.get("dowhileStack"):                 # while文を実行中なら
            dowhileState = globalState["dowhileStack"][-1]
            if currentLine == dowhileState["endLine"]:    # 現在の行が今実行しているwhile文の始まりかどうか
                iswhile = "dowhile"                         

    # while文の始まり
    if iswhile == "while":

        # このwhile文を実行していなかったら、stateを追加
        new = True                                          # 既に実行しているwhile文かどうか 
        if localvars is not None:                           # 関数が呼び出されているなら(ローカル)
            if callStack[-1].get("whileStack"):             # while文を実行中なら
                whileState = callStack[-1]["whileStack"][-1]
                if currentLine == whileState["startLine"]:  # 現在の行が今実行しているwhile文の始まりかどうか
                    new = False                             # 既にループ中なのでステートは追加しない
        else:                                               # 関数が呼び出されていない(グローバル)
            if globalState.get("whileStack"):               # while文を実行中なら
                whileState = globalState["whileStack"][-1]
                if currentLine == whileState["startLine"]:  # 現在の行が今実行しているwhile文の始まりかどうか
                    new = False   


        # 新しいwhile文ならステートを追加する
        if new == True:

            # インデント判定導入後

            # endwhileの行を取得
            endline = None
            i = currentLine + 1                     # 次の行から
            n = len(codes)        

            # 見つかるまで全ての行を探す
            while i < n:                            # 全ての行を越えない  (保険)
                code = codes[i].lstrip()            # 次に見る行から空白を取り除く
                if code.startswith('endwhile'):     # endwhile 
                    # インデントの数が合っていれば、このwhileのendwhileで確定
                    if indent_count(currentLine) == indent_count(i):
                        endline = i                 
                        break
                i += 1

            if endline is None:                     # 最後までendwhileが見つからなかった
                error_msg = f"while に対応する endwhile が見つかりません。\nインデントなどを確認してください。"
                p.parser.error = error_msg
                return


            #stateに渡すもの
            p.parser.new_While = True           # 新しいwhile文に来た(真偽に関わらずstateを追加)
            p.parser.startLine = currentLine    # while開始行 (戻すため)
            p.parser.endLine = endline          # while終了行 (skipのため)

        if condition != True:                   # 条件を満たさなかった(whileの終了)
            p.parser.while_skip = True          # while文終了
        # 満たしていたら、何もしない

    # do whileの終わり
    else:
        if condition != True:                   # 条件を満たさなかった(do whileの終了)
            p.parser.dowhile_end = True         # do while文終了
        else:                                   # 条件を満たした
            p.parser.dowhile_loop = True        # 戻す


# endwhileには来ない想定


# do while
def p_do_while_start(p):  # do
    
    'statement : DO'

    # ステートを作る
    # while(終了)の行を取得
    endline = None
    i = currentLine + 1                     # 次の行から
    n = len(codes)    

    # 見つかるまで全ての行を探す
    while i < n:                            # 全ての行を越えない  (保険)
        code = codes[i].lstrip()            # 次に見る行から空白を取り除く
        if code.startswith('while'):        # while 
            # インデントの数が合っていれば、このdoのwhile(終了)で確定
            if indent_count(currentLine) == indent_count(i):
                endline = i                 
                break
        i += 1

    if endline is None:                     # 最後までwhile(終了)が見つからなかった
        error_msg = f"do に対応する while が見つかりません。\nインデントなどを確認してください。"
        p.parser.error = error_msg
        return


    #stateに渡すもの
    p.parser.doWhile = True                 # do whileに来たことを知らせる
    p.parser.startLine = currentLine        # do while開始行 (戻すため)
    p.parser.endLine = endline              # do while終了行 (skipのため)





#                       構文に使う値を全てvalueにまとめる
# 整数値
def p_value_number(p):
    'value : NUMBER'
    p[0] = p[1]

# 変数の値
def p_value_variable(p):
    'value : NAME'

    name = p[1]
    localvars = latest_local()
    scope = find_scope(name)

    if scope == 'local':                    # localに有る
        p[0] = localvars[name]["value"]     # valueに値を入れて渡す
    elif scope == 'global':                 # globalに有る
        p[0] = globalVars[name]["value"]    # valueに値を入れて渡す
    else:                                   # None (未定義の変数を参照した場合はエラー)
        print(f"エラー: 変数 '{name}' が未定義です", file=sys.stderr)

# 配列の要素番号で指定した要素一つ
# array[i]
def p_value_array_val(p):
    'value : NAME L_S_BRACKET value R_S_BRACKET'
 
    name = p[1]
    number = p[3] - 1                 # 値の要素番号 (配列の要素番号は1から始まるがpythonでは -1)
    localvars = latest_local()
    scope = find_scope(name)          # 配列がlocal, globalどちらか

    # 配列を取得
    if scope == 'local':            # localに有る
        array = localvars[name]["value"]
    elif scope == 'global':         # globalに有る
        array = globalVars[name]["value"]
    else:                               # None (未定義の配列を代入しようとした場合はエラー)
        print(f"エラー: 変数 '{name}' が未定義です", file=sys.stderr)

    # 配列から指定した要素番号の値を取得
    p[0] = array[number] # valueに値を入れて渡す

# array[i] の値          ←の形にも対応
def p_value_array_val_val(p):
    'value : NAME L_S_BRACKET value R_S_BRACKET NO VALUE'
 
    name = p[1]
    number = p[3] - 1                 # 値の要素番号 (配列の要素番号は1から始まるがpythonでは -1)
    localvars = latest_local()
    scope = find_scope(name)          # 配列がlocal, globalどちらか

    # 配列を取得
    if scope == 'local':            # localに有る
        array = localvars[name]["value"]
    elif scope == 'global':         # globalに有る
        array = globalVars[name]["value"]
    else:                               # None (未定義の配列を代入しようとした場合はエラー)
        print(f"エラー: 変数 '{name}' が未定義です", file=sys.stderr)

    # 配列から指定した要素番号の値を取得
    p[0] = array[number] # valueに値を入れて渡す


# 配列の要素数
def p_value_array_length(p):
    'value : NAME NO ARR_LEN'
 
    name = p[1]
    localvars = latest_local()
    scope = find_scope(name)          # 返り値がlocal, globalどちらか(globalの値を返すこともありえる？)

    # 返り値を取得
    if scope == 'local':            # localに有る
        length = len(localvars[name]["value"])
    elif scope == 'global':         # globalに有る
        length = len(globalVars[name]["value"])
    else:                           # None (未定義の配列を参照しようとした場合はエラー)
        print(f"エラー: 配列 '{name}' が未定義です", file=sys.stderr)

    p[0] = length    # valueに値を入れて渡す

# ()内の式を値として使う　　　" ( 式 ) "
def p_value_expression(p):
    'value : L_PAREN value R_PAREN' 

    p[0] = p[2]                     # 受け取った式の結果をvalueに入れる


# ()内の式を値として使う　　　" ( 式 ) の結果 "
def p_value_expression_result(p):
    'value : L_PAREN value R_PAREN NO RESULT' 

    p[0] = p[2]                     # 受け取った式の結果をvalueに入れる


# 加算  
def p_addition(p):
    'value : value PLUS value'

    valuea = p[1]
    valueb = p[3]

    p[0] = valuea + valueb


# 減算
def p_subtract(p):
    'value : value MINUS value'

    valuea = p[1]
    valueb = p[3]

    p[0] = valuea - valueb

# 乗算
def p_multi(p):
    'value : value MULTI value'

    valuea = p[1]
    valueb = p[3]

    p[0] = valuea * valueb

# 除算 (商のみを扱うかなどを受け取って実行)
def p_division(p):
    'value : value DIVID value division_tail'
    valuea = p[1]
    valueb = p[3]
    tail = p[4]

    if tail == 'show':      # 商のみ
        p[0] = valuea // valueb
    else:                   # 通常の除算
        p[0] = valuea / valueb

# 何もない or "の 商"
def p_division_tail_show(p):
    'division_tail : NO SHOW'
    p[0] = 'show'

def p_division_tail_empty(p):
    'division_tail :'
    p[0] = None


def p_error(p):
    # エラーを起こしたトークンと値を報告
    if p:
        print(f"構文エラー \"{p.type}\" ({p.value})", file=sys.stderr)
    # 構文が完成しないまま終了
    else:
        print("構文エラー: 構文が未完成", file=sys.stderr)



# paraserオブジェクト(構文解析器)の作成
parser = yacc.yacc()
#parser = yacc.yacc(debug=True, write_tables=True)   # デバッグ用

# 実行
code = codes[currentLine]                           # 実行する行の取得

parser.parse(code)                                  # 解析実行

# 関数呼び出しの情報を保持
if hasattr(parser, 'funcName'):                     # 構文解析して関数を呼び出したか(関数名があるか)

    # 呼び出し情報をpush
    callStack.append({
        "funcName": getattr(parser, 'funcName', None),      # 関数名をオブジェクトから取得
        "variables": parser.new_local,                      # 保持していた、実引数
        "returnLine": parser.returnLine,                    # 呼び出した次の行
        "endLine": parser.endLine,                          # 関数が終了して次の行
        "funcAction": getattr(parser, 'funcAction', None)   # 関数の返り値を利用するなら、終了後に行う事の情報を追加 
    })

# 新しいif文を実行
if hasattr(parser, 'newIf'):                                        # 新しいif文に入った
    if callStack:                                                   # callStackがある時点でグローバルは参照しなくていい
        callStack[-1].setdefault("ifStack", [])                     # "ifStack"が無ければ空で作る
        callStack[-1]["ifStack"].append({"if_Entered": False})      # ifStackに新しいifのステートをpush(初期化)
    else:                                                           # 関数が呼び出されてない
        globalState.setdefault("ifStack", [])                       # "ifStack"が無ければ空で作る
        globalState["ifStack"].append({"if_Entered": False})        # ifStackに新しいifのステートをpush(初期化)

# if文中で条件を満たして入った
if hasattr(parser, 'if_Entered'):               # if, elseif, elseのどれかに入った
    if callStack:                               # callStackがある時点でグローバルは参照しなくていい    
        callStack[-1]["ifStack"][-1]["if_Entered"] = parser.if_Entered 
    else:                                       # 関数が呼び出されてない    
        globalState["ifStack"][-1]["if_Entered"] = parser.if_Entered

# if文終了
if hasattr(parser, 'if_End'):                   # ifEnd
    if callStack:                                                   # callStackがある時点でグローバルは参照しなくていい
        callStack[-1]["ifStack"].pop()                              # 終了したif文をpop
    else:                                                           # 関数が呼び出されてない
        globalState["ifStack"].pop()                                # 終了したif文をpop

# for文処理 (forに来た)
if hasattr(parser, 'for_Entered'):              # forの行に来た
# 新しいfor文ならparserからステートを入れる
    if parser.for_Entered == "new":
        # for文の情報をpush
        if callStack:                           # 関数が呼び出されているなら(ローカル)
            callStack[-1].setdefault("forStack", [])                # "forStack"が無ければ空で作る
            callStack[-1]["forStack"].append({                      # forStackに新しいforのステートをpush
                "startLine": parser.startLine,                      # for文の開始行
                "endLine": parser.endLine,                          # for文の終了行
                "cntName": parser.cntName,                          # カウンタ変数名
                "cntScope": parser.cntScope,                        # カウンタ変数のスコープ("local" or "global")
                "endValue": parser.endValue,                        # 終了条件の値
                "endType": parser.endType,                          # or_under, or_over
                "changeValue": parser.changeValue,                  # 増減値
                "changeType": parser.changeType                     # "増やす" or "減らす"
            })
        else:                                   # 関数が呼び出されてない(グローバル)
            globalState.setdefault("forStack", [])                  # "forStack"が無ければ空で作る
            globalState["forStack"].append({                        # forStackに新しいforのステートをpush
                "startLine": parser.startLine,                      # for文の開始行
                "endLine": parser.endLine,                          # for文の終了行
                "cntName": parser.cntName,                          # カウンタ変数名
                "cntScope": parser.cntScope,                        # カウンタ変数のスコープ("local" or "global")
                "endValue": parser.endValue,                        # 終了条件の値
                "endType": parser.endType,                          # or_under, or_over
                "changeValue": parser.changeValue,                  # 増減値
                "changeType": parser.changeType                     # "増やす" or "減らす"
            })

    
    # 入れてから条件判定
    # 増減した結果、ループを抜けるなら、増減させない
    # 満たしたらそのまま
    # for文のステートを取得
    if callStack:                                      # 関数が呼び出されているなら(ローカル)
        forState = callStack[-1]["forStack"][-1]       # forStackを取得
    else:                                              # 関数が呼び出されてない(グローバル)
        forState = globalState["forStack"][-1]         # forStackを取得

    for_exec = parser.for_Entered                      # このfor文が初回か、２回目以降か "new" or "roop"
    startline = forState["startLine"]
    endline = forState["endLine"]
    cntname = forState["cntName"]
    cntscope = forState["cntScope"]
    endvalue = forState["endValue"]
    endtype = forState["endType"]
    chanval = forState["changeValue"]
    chantype = forState["changeType"]

    # カウンタ変数を取得    (cntvalを最後に確定させる)
    if cntscope == "local":                             # カウンタ変数がローカル
        cntval = callStack[-1]["variables"][cntname]["value"]
    else:                                               # カウンタ変数がグローバル
        cntval = globalVars[cntname]["value"]

    
    # 条件判定処理(初回と2回目以降)
    if for_exec == "loop":                              # ２回目以降なら仮の増減処理を入れてから判定
        if chantype == "増やす":
            cntval += chanval
        elif chantype == "減らす":
            cntval -= chanval

    for_finish = False                                  # for文が終了したかの判定(初期化)
    if endtype == "or_under":                           # カウンタが終了条件以下(まで)
        if not cntval <= endvalue:                      # 満たさない
            for_finish = True
    elif endtype == "or_over":                          # カウンタが終了条件以上(まで)
        if not cntval >= endvalue:                      # 満たさない
            for_finish = True    

    # 満たさなかったらendforにジャンプとpop
    if for_finish == True:                              # 条件を満たさずforループ終了
        currentLine = endline                           # endforに飛ばす(↓の行設定処理でendforの次になる)    
        if callStack:                                   # 関数が呼び出されているなら(ローカル)
            callStack[-1]["forStack"].pop()             # 終了したfor文をpop
        else:                                           # 関数が呼び出されてない(グローバル)
            globalState["forStack"].pop()               # 終了したfor文をpop
    # 条件を満たしていたらカウンタ変数を確定
    else:
        if cntscope == "local":                         # カウンタ変数がlocal
            callStack[-1]["variables"][cntname]["value"] = cntval
        else:                                           # カウンタ変数がglobal
            globalVars[cntname]["value"] = cntval


# while文処理 
if hasattr(parser, 'new_While'):    # 新しいwhile文に来た
    # parserからステートを受け取る
        # while文の情報をpush
        if callStack:                           # 関数が呼び出されているなら(ローカル)
            callStack[-1].setdefault("whileStack", [])              # "whileStack"が無ければ空で作る
            callStack[-1]["whileStack"].append({                    # whileStackに新しいforのステートをpush
                "startLine": parser.startLine,                      # while文の開始行
                "endLine": parser.endLine,                          # while文の終了行
            })
        else:                                   # 関数が呼び出されてない(グローバル)
            globalState.setdefault("whileStack", [])                # "whileStack"が無ければ空で作る
            globalState["whileStack"].append({                      # whileStackに新しいforのステートをpush
                "startLine": parser.startLine,                      # while文の開始行
                "endLine": parser.endLine,                          # while文の終了行
            })


# do while文処理
if hasattr(parser, 'doWhile'):    # do while文に入った
    # parserからステートを受け取る
        # do while文の情報をpush
        if callStack:                           # 関数が呼び出されているなら(ローカル)
            callStack[-1].setdefault("dowhileStack", [])              # "whileStack"が無ければ空で作る
            callStack[-1]["dowhileStack"].append({                    # whileStackに新しいforのステートをpush
                "startLine": parser.startLine,                      # while文の開始行
                "endLine": parser.endLine,                          # while文の終了行
            })
        else:                                   # 関数が呼び出されてない(グローバル)
            globalState.setdefault("dowhileStack", [])                # "whileStack"が無ければ空で作る
            globalState["dowhileStack"].append({                      # whileStackに新しいforのステートをpush
                "startLine": parser.startLine,                      # while文の開始行
                "endLine": parser.endLine,                          # while文の終了行
            })



# 次に実行する行の設定
if hasattr(parser, 'jump'):                                 # parserにjumpがあるか（構文解析してjump行へのスキップが指定されたか)
    currentLine = parser.jump
elif hasattr(parser, 'if_skip'):                            # if文のスキップ処理
    currentLine = if_nextline(currentLine)
elif hasattr(parser, 'while_skip'):                         # while文のスキップ処理
    # endwhileを取得
    if callStack:                                           # 関数が呼び出されているなら(ローカル)
        whilestate = callStack[-1]["whileStack"].pop()      # while文終了によりステートをpop 
    else:                                                   # 関数が呼び出されてない(グローバル)
        whilestate = globalState["whileStack"].pop()        # while文終了によりステートをpop
    endline = whilestate["endLine"]                         # while終了行を取得   
    currentLine = endline + 1                               # endwhileの次行へ
elif hasattr(parser, 'dowhile_end'):                        # do while文の終了処理
    # while(do whileの終了行)を取得
    if callStack:                                           # 関数が呼び出されているなら(ローカル)
        dowhilestate = callStack[-1]["dowhileStack"].pop()  # do while文終了によりステートをpop 
    else:                                                   # 関数が呼び出されてない(グローバル)
        dowhilestate = globalState["dowhileStack"].pop()    # do while文終了によりステートをpop
    endline = dowhilestate["endLine"]                       # do while終了行を取得   
    currentLine = endline + 1                               # while(終了)の次行へ
elif hasattr(parser, 'dowhile_loop'):                       # do while文のループ処理
    # do (do whileの開始行)を取得
    if callStack:                                           # 関数が呼び出されているなら(ローカル)
        dowhilestate = callStack[-1]["dowhileStack"][-1]    # do whileステートを取得 
    else:                                                   # 関数が呼び出されてない(グローバル)
        dowhilestate = globalState["dowhileStack"][-1]      # do whileステートを取得
    startline = dowhilestate["startLine"]                   # do while終了行を取得   
    currentLine = startline + 1                             # doの次行へ

else:                                                       # 何もなければ次の行へ
    currentLine += 1

# ここから次の行を参照 

# スキップ処理はループにする必要がある？
n = len(codes)
while currentLine < n:                  # 全ての行を越えない
    skipped = False                     # skip判定をリセット
    code = codes[currentLine].lstrip()  # 次の行の左端から空白を取り除く
    # 空白スキップ
    if code == "":
        skipped = True

    # # 関数定義のスキップは別に考える必要がある(構文解析を使ってスキップしている)
    # elif code.startswith("〇"):
    #     skipped = True

    # コメントアウトスキップ
    elif code.startswith("//"):
        skipped = True

    if skipped == False:                # skipしていなかったら抜ける
        break

    currentLine += 1

# ループ処理

# currentLineがendforならforの行に戻る (endforの行は実行しない)
# 参照するend と 戻すfor
if callStack:                                    # 関数実行中(ローカル)        
    if callStack[-1].get("forStack"):                # for文実行中      (無ければ Noneを返すからkeyエラーが起きない)
        if currentLine == callStack[-1]["forStack"][-1]["endLine"]:  # 次の行がendfor
            currentLine = callStack[-1]["forStack"][-1]["startLine"] # forの行に戻る
else:                                            # 関数を実行していない(グローバル)
    if globalState.get("forStack"):                  # for文実行中
        if currentLine == globalState["forStack"][-1]["endLine"]:    # 次の行がendfor
            currentLine = globalState["forStack"][-1]["startLine"]   # forの行に戻る

# currentLineがendwhileならwhileの行に戻る (endwhileの行は実行しないから必ず戻す)
# while文に入っている時のみここに来る
# 参照するend と 戻すwhile
if callStack:                                    # 関数実行中(ローカル)        
    if callStack[-1].get("whileStack"):                # while文実行中      (無ければ Noneを返すからkeyエラーが起きない)
        if currentLine == callStack[-1]["whileStack"][-1]["endLine"]:  # 次の行がendwhile
            currentLine = callStack[-1]["whileStack"][-1]["startLine"] # whileの行に戻る
else:                                            # 関数を実行していない(グローバル)
    if globalState.get("whileStack"):                  # while文実行中
        if currentLine == globalState["whileStack"][-1]["endLine"]:    # 次の行がendwhile
            currentLine = globalState["whileStack"][-1]["startLine"]   # whileの行に戻る


# 呼び出していた関数の終了
# callStackがある　＆　次の行が呼び出した関数を越えた or returnした
if callStack and (currentLine >= callStack[-1]["endLine"] or hasattr(parser, 'ret')):     # -1 後ろから
    endFunc = callStack.pop()                                   # 終了する関数呼び出しデータをpop　（この時点でStackからは消える)

    funcAction = endFunc.get("funcAction")                      # 終了した関数に返り値を使う処理があるなら取得
    if funcAction is not None:                                  # ↑があるなら
        if funcAction["type"] == "assign":                      # 返り値を代入なら
            name = funcAction["name"]                           # 代入先の変数名を取得
            value = getattr(parser, 'retValue', None)           # 代入する返り値を取得
            if funcAction["scope"] == "local":                  # 代入先がlocal
                localVar = funcAction["scope_ref"]              # 代入先の入ってるローカル変数の参照を取得
                localVar[name]["value"] = value                 # 返り値の代入処理
                # ↑だけでは返り値を変数に代入して更新できないことがあったため直接callStackの辞書も更新
                callStack[-1]["variables"] = localVar
            else:                                               # 代入先がglobal
                globalVars[name]["value"] = value                        # 返り値の代入処理

    currentLine = endFunc["returnLine"]                         # 関数呼び出し位置の次をcurrentLineに

# 出力
# globalVars, output, currentLine, functions, callStackを文字列型(json)に変換して返す
# 1つのオブジェクト(result)にまとめて返す
result = {
    "globalVars": globalVars,
    "globalState": globalState,
    "output": output,
    "currentLine": currentLine,
    "functions": functions,
    "callStack": callStack,
}

# errorがあれば追加
if hasattr(parser, 'error'):
    result["error"] = parser.error

# json形式にして出力(返す)
# ensure_ascii=False : 非ASCII文字をエスケープしない（文字化け防止）
print(json.dumps(result, ensure_ascii=False))