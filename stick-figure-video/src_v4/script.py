# -*- coding: utf-8 -*-
"""Guion del video: Guia de estudio de ingles + texto de The Last of Us.

Lineas de narracion:
  "texto"      -> voz en espanol; lo que va entre {llaves} se pronuncia en ingles
  "en:texto"   -> voz nativa en ingles (ejemplos)
  "pause:1.5"  -> silencio
Items del pizarron (se revelan paso a paso):
  ('p', txt) parrafo   ('st', txt) estructura   ('ex', en, es) ejemplo
  ('tip', txt) nota    ('vocab', en, es)        ('word', w, meaning, en, es)
  ('cmp', h1, t1, h2, t2)   ('row3', a, b, c, header?)   ('bul', txt)
"""

SCENES = []


def B(v, r, *say):
    return {"v": v, "r": r, "say": list(say)}


def scene(sid, chip, title, sub, items, beats, **kw):
    d = dict(id=sid, chip=chip, title=title, sub=sub, items=items, beats=beats)
    d.update(kw)
    SCENES.append(d)


# ---------------------------------------------------------------- INTRO
scene("intro", "INGLÉS", "GUÍA DE ESTUDIO – INGLÉS",
      "Explicada paso a paso, con ejemplos y traducciones sencillas",
      [("p", "1. Vocabulary · 2. Grammar · 3. Resumen · 4. Diferencias · 5. Práctica · 6. Cómo estudiar"),
       ("tip", "Al final: un texto en inglés sobre el juego {The Last of Us}")],
      [B("intro", 0, "¡Hola! Hoy vamos a repasar, paso a paso, la guía de estudio de inglés.",
         "Está explicada con ejemplos y traducciones sencillas."),
       B(None, 1, "Vamos a ver vocabulario, gramática, un resumen, las diferencias clave, práctica, y cómo estudiar."),
       B("intro_game", 2, "Y al final, te espera un texto en inglés sobre el juego {The Last of Us}.")],
      big_title=True)

scene("howto", "ANTES DE EMPEZAR", "Cómo usar esta guía", "Tres pasos",
      [("bul", "1. Primero leé la explicación en español."),
       ("bul", "2. Después mirá la estructura y los ejemplos."),
       ("bul", "3. Por último, tapá la traducción e intentá decir qué significa cada oración.")],
      [B("read", 0, "Primero: cómo usar esta guía."),
       B("read", 1, "Uno: leé la explicación en español."),
       B("look", 2, "Dos: mirá la estructura y los ejemplos."),
       B("cover", 3, "Tres: tapá la traducción, e intentá decir qué significa cada oración.")])

# ---------------------------------------------------------------- 1. VOCABULARY
scene("vocab", "PARTE 1", "1. VOCABULARY", "Vocabulario",
      [("p", "No hace falta aprender todas las palabras de una sola vez."),
       ("tip", "Estudialas por grupos y tratá de reconocerlas cuando aparezcan en una oración.")],
      [B("words", 0, "Parte uno: {vocabulary}, vocabulario."),
       B(None, 1, "No hace falta aprender todas las palabras de una sola vez."),
       B("groups", 2, "Estudialas por grupos, y tratá de reconocerlas cuando aparezcan en una oración.")],
      big_title=True)

VOCAB = [
    ("v_clothes", "Clothes and accessories", "Ropa y accesorios", "clothes", [
        ("T-shirt", "remera"), ("jeans", "jeans"), ("dress", "vestido"), ("skirt", "pollera"),
        ("shoes", "zapatos"), ("jacket", "campera"), ("hat", "sombrero"),
        ("sunglasses", "anteojos de sol"), ("bag", "bolso / cartera|bolso, o cartera")]),
    ("v_ent", "Entertainment: Music and Films", "Entretenimiento", "entertainment", [
        ("movie / film|movie, or film", "película"), ("actor", "actor"), ("singer", "cantante"),
        ("song", "canción"), ("concert", "concierto"), ("comedy", "comedia"),
        ("horror film", "película de terror"), ("action film", "película de acción")]),
    ("v_hobbies", "Hobbies and Free Time", "Pasatiempos y tiempo libre", "hobbies", [
        ("dancing", "bailar"), ("singing", "cantar"), ("reading", "leer"), ("swimming", "nadar"),
        ("playing football", "jugar al fútbol"), ("listening to music", "escuchar música"),
        ("watching TV", "mirar televisión")]),
    ("v_tech", "Technology", "Tecnología", "technology", [
        ("computer", "computadora"), ("laptop", "computadora portátil"), ("mobile phone", "celular"),
        ("headphones", "auriculares"), ("keyboard", "teclado"), ("screen", "pantalla"),
        ("internet", "internet")]),
    ("v_places", "Places and buildings", "Lugares y edificios", "places", [
        ("school", "escuela"), ("hospital", "hospital"), ("bank", "banco"), ("library", "biblioteca"),
        ("cinema", "cine"), ("museum", "museo"), ("park", "parque"), ("restaurant", "restaurante")]),
    ("v_jobs", "Occupations and professions", "Profesiones", "jobs", [
        ("teacher", "docente / profesor|docente, o profesor"), ("doctor", "médico"),
        ("nurse", "enfermero/a|enfermero, o enfermera"), ("police officer", "policía"),
        ("chef", "cocinero/a|cocinero, o cocinera"), ("singer", "cantante"),
        ("engineer", "ingeniero/a|ingeniero, o ingeniera")]),
    ("v_feel", "Personal feelings and opinions", "Sentimientos y opiniones", "feelings", [
        ("happy", "feliz"), ("sad", "triste"), ("angry", "enojado/a|enojado, o enojada"),
        ("bored", "aburrido/a|aburrido, o aburrida"), ("excited", "emocionado/a|emocionado, o emocionada"),
        ("scared", "asustado/a|asustado, o asustada"), ("I think", "pienso que"), ("I believe", "creo que")]),
    ("v_travel", "Travel and transport. Holidays", "Viajes, transporte y vacaciones", "travel_vocab", [
        ("plane", "avión"), ("bus", "colectivo"), ("train", "tren"), ("car", "auto"),
        ("holiday", "vacaciones"), ("beach", "playa"), ("hotel", "hotel"), ("airport", "aeropuerto")]),
]
for i, (sid, t, s, v, pairs) in enumerate(VOCAB):
    items, beats = [], [B(v, 0, "Grupo %d: {%s}. %s." % (i + 1, t.replace(":", ","), s))]
    for en, es in pairs:
        en_show, en_say = (en.split("|") + [None])[:2]
        es_show, es_say = (es.split("|") + [None])[:2]
        items.append(("vocab", en_show, es_show))
        beats.append(B(None, len(items), "en:" + (en_say or en_show) + ".", (es_say or es_show) + "."))
    scene(sid, "1 · VOCABULARY", t, s, items, beats, vocab=True)

# ---------------------------------------------------------------- 2. GRAMMAR
scene("grammar", "PARTE 2", "2. GRAMMAR", "Gramática",
      [("p", "Antes de empezar:"),
       ("st", "{subject} = sujeto ({I, you, he, she, it, we, they})"),
       ("st", "{verb} = verbo"),
       ("st", "{past participle} = tercera forma del verbo ({go – went – gone})")],
      [B("grammar", 1, "Parte dos: {grammar}, gramática.", "Antes de empezar, tres palabras clave."),
       B(None, 2, "{Subject} significa sujeto: {I, you, he, she, it, we, they}."),
       B(None, 3, "{Verb} significa verbo."),
       B("gowentgone", 4, "{Past participle} es la tercera forma del verbo. Por ejemplo: {go, went, gone}.")],
      big_title=True)

G = "2 · GRAMMAR"

scene("A", G, "A. Present Simple", "Presente simple",
      [("p", "¿Cuándo se usa? Para rutinas, hábitos y cosas que pasan normalmente."),
       ("p", "Pistas: {every day} (todos los días) · {usually} (generalmente) · {always} (siempre) · {never} (nunca)"),
       ("st", "Afirmativa: {I/you/we/they} + verbo · {He/she/it} + verbo con {-s}"),
       ("ex", "I play football.", "Juego al fútbol."),
       ("ex", "She plays football.", "Ella juega al fútbol."),
       ("st", "Negativa: {don't / doesn't} + verbo base"),
       ("ex", "I don't play.", "No juego."),
       ("ex", "She doesn't play.", "Ella no juega."),
       ("st", "Pregunta: {Do / Does} + sujeto + verbo base?"),
       ("ex", "Do you study?", "¿Estudiás?"),
       ("ex", "Does he study?", "¿Él estudia?"),
       ("tip", "Truco: con {he, she} e {it}, en afirmativo agregamos {-s} al verbo. Con {doesn't}, el verbo vuelve a su forma normal: {doesn't like}, no {doesn't likes}.")],
      [B("routine", 1, "Tema A: el {Present Simple}, o presente simple.",
         "¿Cuándo se usa? Para rutinas, hábitos, y cosas que pasan normalmente."),
       B(None, 2, "Pistas frecuentes: {every day}, todos los días. {Usually}, generalmente. {Always}, siempre. {Never}, nunca."),
       B("football", 3, "En la afirmativa: con {I, you, we, they}, va el verbo. Con {he, she, it}, el verbo lleva una ese al final."),
       B(None, 4, "en:I play football.", "Juego al fútbol."),
       B("football_she", 5, "en:She plays football.", "Ella juega al fútbol."),
       B("noplay", 6, "En la negativa: {don't} o {doesn't}, más el verbo base."),
       B(None, 7, "en:I don't play.", "No juego."),
       B(None, 8, "en:She doesn't play.", "Ella no juega."),
       B("study_q", 9, "En la pregunta: {Do} o {Does}, más el sujeto, más el verbo base."),
       B(None, 10, "en:Do you study?", "¿Estudiás?"),
       B(None, 11, "en:Does he study?", "¿Él estudia?"),
       B("tip", 12, "Truco: con {he, she} e {it}, en afirmativo generalmente agregamos una ese al verbo.",
         "Con {doesn't}, el verbo vuelve a su forma normal: se dice {doesn't like}, no {doesn't likes}.")])

scene("B", G, "B. Present Continuous", "Presente continuo",
      [("p", "¿Cuándo se usa? Para algo que está pasando ahora o en este momento."),
       ("p", "Pistas: {now} (ahora) · {right now} (justo ahora) · {at the moment} (en este momento)"),
       ("st", "sujeto + {am / is / are} + verbo terminado en {-ing}"),
       ("ex", "I am studying now.", "Estoy estudiando ahora."),
       ("ex", "She is sleeping.", "Ella está durmiendo."),
       ("ex", "They are playing.", "Ellos están jugando."),
       ("tip", "Recordá: {I am} · {he/she/it is} · {you/we/they are}")],
      [B("now", 1, "Tema B: el {Present Continuous}, presente continuo.",
         "Se usa para algo que está pasando ahora, o en este momento."),
       B(None, 2, "Pistas: {now}, ahora. {Right now}, justo ahora. {At the moment}, en este momento."),
       B(None, 3, "Estructura: sujeto, más {am, is} o {are}, más el verbo terminado en {ing}."),
       B("studying", 4, "en:I am studying now.", "Estoy estudiando ahora."),
       B("sleeping_she", 5, "en:She is sleeping.", "Ella está durmiendo."),
       B("playing", 6, "en:They are playing.", "Ellos están jugando."),
       B("tip", 7, "Recordá: {I am}. {He, she, it, is}. {You, we, they, are}.")])

scene("C", G, "C. Present Simple o Present Continuous", "¿Cuál uso?",
      [("cmp", "Present Simple", "Rutina o costumbre", "Present Continuous", "Acción que sucede ahora"),
       ("ex", "I play tennis every Saturday.", "Juego al tenis todos los sábados."),
       ("ex", "I am playing tennis now.", "Estoy jugando al tenis ahora.")],
      [B("tennis_split", 0, "Tema C: ¿{Present Simple}, o {Present Continuous}?"),
       B(None, 1, "El {Present Simple} es para una rutina o costumbre. El {Present Continuous}, para una acción que sucede ahora."),
       B("tennis_sat", 2, "en:I play tennis every Saturday.", "Juego al tenis todos los sábados."),
       B("tennis_now", 3, "en:I am playing tennis now.", "Estoy jugando al tenis ahora.")])

scene("D", G, "D. Past Simple", "Pasado simple",
      [("p", "¿Cuándo se usa? Para acciones que empezaron y terminaron en el pasado."),
       ("p", "Pistas: {yesterday} (ayer) · {last week} (la semana pasada) · {two days ago} (hace dos días)"),
       ("st", "Afirmativa: sujeto + verbo en pasado"),
       ("ex", "I watched a film.", "Vi una película."),
       ("st", "Negativa: sujeto + {didn't} + verbo base"),
       ("ex", "I didn't watch a film.", "No vi una película."),
       ("st", "Pregunta: {Did} + sujeto + verbo base?"),
       ("ex", "Did you watch a film?", "¿Viste una película?"),
       ("tip", "Verbos regulares ({watch → watched}) o irregulares ({go → went}). Después de {did} o {didn't}, verbo base: {didn't go}, no {didn't went}.")],
      [B("yesterday", 1, "Tema D: el {Past Simple}, pasado simple.",
         "Se usa para acciones que empezaron y terminaron en el pasado."),
       B(None, 2, "Pistas: {yesterday}, ayer. {Last week}, la semana pasada. {Two days ago}, hace dos días."),
       B("tv", 4, "Afirmativa: sujeto, más el verbo en pasado.", "en:I watched a film.", "Vi una película."),
       B("tv_no", 6, "Negativa: sujeto, más {didn't}, más el verbo base.", "en:I didn't watch a film.", "No vi una película."),
       B("tv_q", 8, "Pregunta: {Did}, más sujeto, más verbo base.", "en:Did you watch a film?", "¿Viste una película?"),
       B("tip", 9, "Los verbos pueden ser regulares, como {watch, watched}, o irregulares, como {go, went}.",
         "Después de {did} o {didn't}, se usa el verbo base: {didn't go}, no {didn't went}.")])

scene("E", G, "E. Past Continuous", "Pasado continuo",
      [("p", "¿Cuándo se usa? Para contar qué estaba pasando en un momento del pasado."),
       ("st", "sujeto + {was / were} + verbo-{ing}   ·   {I/he/she/it was} · {you/we/they were}"),
       ("ex", "I was sleeping.", "Yo estaba durmiendo."),
       ("ex", "They were playing.", "Ellos estaban jugando."),
       ("p", "{Past Simple} + {Past Continuous}: una acción estaba ocurriendo y otra la interrumpió. La acción larga va en {Past Continuous}; la que interrumpe, en {Past Simple}."),
       ("ex", "I was sleeping when the phone rang.", "Estaba durmiendo cuando sonó el teléfono.")],
      [B("past_clock", 1, "Tema E: el {Past Continuous}, pasado continuo.",
         "Sirve para contar qué estaba pasando en un momento del pasado."),
       B(None, 2, "Estructura: sujeto, más {was} o {were}, más el verbo con {ing}.",
         "{I, he, she, it}: {was}. {You, we, they}: {were}."),
       B("sleeping", 3, "en:I was sleeping.", "Yo estaba durmiendo."),
       B("playing", 4, "en:They were playing.", "Ellos estaban jugando."),
       B("sleeping", 5, "Ahora combinamos {Past Simple} y {Past Continuous}: una acción estaba ocurriendo, y otra la interrumpió.",
         "La acción larga va en {Past Continuous}. La que interrumpe, en {Past Simple}."),
       B("phone_rang", 6, "en:I was sleeping when the phone rang.", "Estaba durmiendo cuando sonó el teléfono.")])

scene("F", G, "F. Used to", "Hábitos del pasado",
      [("p", "¿Cuándo se usa? Para hábitos o situaciones que eran habituales antes, pero ahora ya no."),
       ("st", "Afirmativa: {used to} + verbo"),
       ("ex", "I used to dance.", "Antes bailaba."),
       ("st", "Negativa: {didn't use to} + verbo"),
       ("ex", "I didn't use to dance.", "Antes no bailaba."),
       ("st", "Pregunta: {Did} + sujeto + {use to} + verbo?"),
       ("ex", "Did you use to dance?", "¿Antes bailabas?")],
      [B("usedto", 1, "Tema F: {used to}.",
         "Se usa para hábitos o situaciones que eran habituales antes, pero ahora ya no."),
       B(None, 3, "Afirmativa: {used to}, más el verbo.", "en:I used to dance.", "Antes bailaba."),
       B("usedto_no", 5, "Negativa: {didn't use to}, más el verbo.", "en:I didn't use to dance.", "Antes no bailaba."),
       B("usedto_q", 7, "Pregunta: {Did}, más sujeto, más {use to}, más el verbo.", "en:Did you use to dance?", "¿Antes bailabas?")])

scene("G", G, "G. Going to", "Futuro con planes",
      [("p", "¿Cuándo se usa? Para planes o intenciones que ya decidiste."),
       ("st", "sujeto + {am / is / are} + {going to} + verbo base"),
       ("ex", "I am going to travel.", "Voy a viajar."),
       ("ex", "She is going to study.", "Ella va a estudiar."),
       ("tip", "No agregues {'to'} después del verbo principal: {I am going to travel} (correcto).")],
      [B("plan", 1, "Tema G: {going to}, el futuro con planes.", "Se usa para planes o intenciones que ya decidiste."),
       B(None, 2, "Estructura: sujeto, más {am, is} o {are}, más {going to}, más el verbo base."),
       B("travel", 3, "en:I am going to travel.", "Voy a viajar."),
       B("study_she", 4, "en:She is going to study.", "Ella va a estudiar."),
       B("tip", 5, "No agregues {to} después del verbo principal. Lo correcto es: {I am going to travel}.")])

scene("H", G, "H. Present Continuous con significado futuro", "Planes ya organizados",
      [("p", "También se puede usar el {Present Continuous} para un plan futuro que ya está organizado, muchas veces con una fecha o un horario."),
       ("ex", "I am meeting my friends tomorrow.", "Me encuentro con mis amigos mañana."),
       ("ex", "She is traveling next week.", "Ella viaja la semana que viene.")],
      [B("agenda", 1, "Tema H: el {Present Continuous} con significado futuro.",
         "También se puede usar para un plan futuro que ya está organizado, muchas veces con una fecha o un horario."),
       B("friends", 2, "en:I am meeting my friends tomorrow.", "Me encuentro con mis amigos mañana."),
       B("travel_she", 3, "en:She is traveling next week.", "Ella viaja la semana que viene.")])

scene("I", G, "I. Will / Won't", "Predicciones, promesas y decisiones",
      [("p", "¿Cuándo se usa? Para predicciones, promesas, ofrecimientos y decisiones tomadas en el momento."),
       ("st", "{will} + verbo base   ·   negativa: {won't} + verbo base"),
       ("ex", "I think it will rain.", "Creo que va a llover."),
       ("ex", "I won't forget.", "No me voy a olvidar."),
       ("ex", "I'll help you.", "Te ayudo / Te ayudaré."),
       ("tip", "Diferencia fácil: {going to} suele ser un plan pensado antes; {will} suele ser una decisión espontánea, una promesa u opinión sobre el futuro.")],
      [B("crystal", 1, "Tema I: {will} y {won't}.",
         "Se usan para predicciones, promesas, ofrecimientos, y decisiones tomadas en el momento."),
       B(None, 2, "Estructura: {will}, más el verbo base. La forma negativa es {won't}, más el verbo base."),
       B("rain", 3, "en:I think it will rain.", "Creo que va a llover."),
       B("promise", 4, "en:I won't forget.", "No me voy a olvidar."),
       B("help", 5, "en:I'll help you.", "Te ayudo, o te ayudaré."),
       B("tip", 6, "Diferencia fácil: {going to} suele ser un plan pensado antes.",
         "{Will} suele ser una decisión espontánea, una promesa, u opinión sobre el futuro.")])

scene("J", G, "J. Present Perfect", "Experiencias",
      [("p", "¿Cuándo se usa? Para experiencias o acciones pasadas que tienen relación con el presente. No se dice exactamente cuándo pasó."),
       ("st", "sujeto + {have / has} + participio pasado"),
       ("st", "{I / you / we / they} → {have}"),
       ("ex", "I have visited Brazil.", "He visitado Brasil."),
       ("st", "{he / she / it} → {has}"),
       ("ex", "She has eaten.", "Ella ha comido."),
       ("p", "Participios: {visit–visited–visited} · {play–played–played} · {go–went–gone} · {eat–ate–eaten}")],
      [B("experience", 1, "Tema J: el {Present Perfect}.",
         "Se usa para experiencias o acciones pasadas que tienen relación con el presente. No se dice exactamente cuándo pasó."),
       B(None, 2, "Estructura: sujeto, más {have} o {has}, más el participio pasado."),
       B("brazil", 4, "Con {I, you, we, they}, usamos {have}.", "en:I have visited Brazil.", "He visitado Brasil."),
       B("eaten", 6, "Con {he, she, it}, usamos {has}.", "en:She has eaten.", "Ella ha comido."),
       B("gowentgone", 7, "Ejemplos de participios:",
         "en:visit, visited, visited. play, played, played. go, went, gone. eat, ate, eaten.")])

scene("K", G, "K. Present Perfect o Past Simple", "¿Cuál uso?",
      [("cmp", "Present Perfect", "No se indica un momento terminado; importa la experiencia o conexión con el presente.",
        "Past Simple", "Se indica cuándo pasó; la acción terminó."),
       ("ex", "I have visited Paris.", "He visitado París."),
       ("ex", "I visited Paris last year.", "Visité París el año pasado."),
       ("tip", "Si aparece {yesterday}, {last year} o {ago}, normalmente usamos {Past Simple}.")],
      [B("paris", 1, "Tema K: ¿{Present Perfect}, o {Past Simple}?",
         "En el {Present Perfect} no se indica un momento terminado: importa la experiencia, o la conexión con el presente.",
         "En el {Past Simple} se indica cuándo pasó, y la acción terminó."),
       B(None, 2, "en:I have visited Paris.", "He visitado París."),
       B("paris_cal", 3, "en:I visited Paris last year.", "Visité París el año pasado."),
       B("tip", 4, "Si aparece {yesterday}, {last year} o {ago}, normalmente usamos {Past Simple}.")])

scene("L", G, "L. Just / Already / Yet", "Acaba de · ya · todavía",
      [("word", "just", "acaba de; algo pasó hace muy poco", "I have just arrived.", "Acabo de llegar."),
       ("word", "already", "ya; generalmente en afirmativas", "She has already eaten.", "Ella ya comió."),
       ("word", "yet", "ya en preguntas / todavía en negativas; suele ir al final", "Have you finished yet?", "¿Ya terminaste?"),
       ("ex", "I haven't finished yet.", "Todavía no terminé.")],
      [B("arrive", 0, "Tema L: {just}, {already} y {yet}."),
       B(None, 1, "{Just} significa acaba de: algo pasó hace muy poco.", "en:I have just arrived.", "Acabo de llegar."),
       B("eaten", 2, "{Already} significa ya, y generalmente va en afirmativas.", "en:She has already eaten.", "Ella ya comió."),
       B("finished_q", 3, "{Yet} significa ya en preguntas, y todavía en negativas. Suele ir al final.",
         "en:Have you finished yet?", "¿Ya terminaste?"),
       B("not_finished", 4, "en:I haven't finished yet.", "Todavía no terminé.")])

scene("M", G, "M. Present Perfect Continuous", "Duración de una actividad",
      [("p", "¿Cuándo se usa? Para destacar cuánto tiempo lleva ocurriendo una actividad que empezó en el pasado y continúa, o tiene efecto ahora."),
       ("st", "sujeto + {have / has} + {been} + verbo-{ing}"),
       ("ex", "I have been studying for two hours.", "Estoy estudiando desde hace dos horas."),
       ("ex", "She has been working all day.", "Ella ha estado trabajando todo el día."),
       ("tip", "{For} = durante ({for two hours}). {Since} = desde un momento concreto ({since Monday}).")],
      [B("long_study", 1, "Tema M: el {Present Perfect Continuous}.",
         "Sirve para destacar cuánto tiempo lleva ocurriendo una actividad que empezó en el pasado y continúa, o tiene efecto ahora."),
       B(None, 2, "Estructura: sujeto, más {have} o {has}, más {been}, más el verbo con {ing}."),
       B("long_study", 3, "en:I have been studying for two hours.", "Estoy estudiando desde hace dos horas."),
       B("working", 4, "en:She has been working all day.", "Ella ha estado trabajando todo el día."),
       B("tip", 5, "{For} significa durante, como en {for two hours}.",
         "{Since} significa desde un momento concreto, como en {since Monday}.")])

scene("N", G, "N. Something / Anything / Nothing", "Somebody / Anybody / Nobody",
      [("word", "something", "algo · afirmativa", "I want something.", "Quiero algo."),
       ("word", "anything", "algo / nada · preguntas y negativas", "Do you need anything? / I don't need anything.", ""),
       ("word", "nothing", "nada · afirmativa con sentido negativo", "There is nothing.", "No hay nada."),
       ("word", "somebody", "alguien", "Somebody is here.", "Alguien está acá."),
       ("word", "anybody", "alguien / nadie", "Is anybody home?", "¿Hay alguien en casa?"),
       ("word", "nobody", "nadie", "Nobody called.", "Nadie llamó."),
       ("tip", "Atención: en inglés estándar no se suele usar doble negativo. Decimos {I don't know anything} o {I know nothing}, pero no {I don't know nothing}.")],
      [B("box_q", 0, "Tema N: {something, anything, nothing}, y {somebody, anybody, nobody}."),
       B("box_want", 1, "{Something} significa algo, y se usa en afirmativas.", "en:I want something.", "Quiero algo."),
       B("box_q", 2, "{Anything} significa algo, o nada. Se usa en preguntas y negativas.",
         "en:Do you need anything? I don't need anything."),
       B("box_empty", 3, "{Nothing} significa nada. Va en una afirmativa, con sentido negativo.", "en:There is nothing.", "No hay nada."),
       B("somebody", 4, "{Somebody} significa alguien.", "en:Somebody is here.", "Alguien está acá."),
       B("knock", 5, "{Anybody} significa alguien, o nadie.", "en:Is anybody home?", "¿Hay alguien en casa?"),
       B("nobody_called", 6, "{Nobody} significa nadie.", "en:Nobody called.", "Nadie llamó."),
       B("tip", 7, "Atención: en inglés estándar no se suele usar doble negativo.",
         "Decimos {I don't know anything}, o {I know nothing}. Pero no: {I don't know nothing}.")])

scene("O", G, "O. Comparatives and Superlatives", "Comparativos y superlativos",
      [("p", "{Comparative}: compara dos cosas y suele llevar {than} (que). {Superlative}: dice que algo es el más o la más dentro de un grupo."),
       ("row3", "Adjetivo", "Comparativo", "Superlativo", True),
       ("row3", "{tall} (alto)", "{taller than} (más alto que)", "{the tallest} (el más alto)"),
       ("row3", "{small} (pequeño)", "{smaller than}", "{the smallest}"),
       ("row3", "{beautiful} (hermoso)", "{more beautiful than}", "{the most beautiful}"),
       ("ex", "My house is bigger than yours.", "Mi casa es más grande que la tuya."),
       ("ex", "She is the tallest in the class.", "Ella es la más alta de la clase."),
       ("tip", "Regla rápida: adjetivos cortos agregan {-er / -est}; los largos usan {more / the most}. Irregulares: {good → better → the best}.")],
      [B("heights", 1, "Tema O: {comparatives} y {superlatives}.",
         "El {comparative} compara dos cosas, y suele llevar {than}, que significa que.",
         "El {superlative} dice que algo es el más, o la más, dentro de un grupo."),
       B(None, 3, "{Tall} significa alto.", "en:taller than.", "más alto que.", "en:the tallest.", "el más alto."),
       B(None, 4, "{Small}, pequeño.", "en:smaller than. the smallest."),
       B(None, 5, "{Beautiful}, hermoso.", "en:more beautiful than. the most beautiful."),
       B("houses", 6, "en:My house is bigger than yours.", "Mi casa es más grande que la tuya."),
       B("heights_she", 7, "en:She is the tallest in the class.", "Ella es la más alta de la clase."),
       B("tip", 8, "Regla rápida: muchos adjetivos cortos agregan {er} o {est}. Los largos suelen usar {more} o {the most}.",
         "Y hay irregulares: {good, better, the best}.")])

scene("P", G, "P. Modal verbs", "must · have to · ought to · should",
      [("p", "Son verbos que acompañan a otro verbo y expresan obligación, necesidad o consejo."),
       ("word", "must", "deber / obligación fuerte", "You must wear a helmet.", "Debés usar casco."),
       ("word", "have to", "tener que / necesidad", "I have to study.", "Tengo que estudiar."),
       ("word", "should", "debería / consejo", "You should rest.", "Deberías descansar."),
       ("word", "ought to", "debería / consejo", "You ought to help.", "Deberías ayudar.")],
      [B("modals", 1, "Tema P: los {modal verbs}: {must, have to, ought to} y {should}.",
         "Son verbos que acompañan a otro verbo, y expresan obligación, necesidad o consejo."),
       B("helmet", 2, "{Must}: deber, obligación fuerte.", "en:You must wear a helmet.", "Debés usar casco."),
       B("homework", 3, "{Have to}: tener que, necesidad.", "en:I have to study.", "Tengo que estudiar."),
       B("rest", 4, "{Should}: debería, consejo.", "en:You should rest.", "Deberías descansar."),
       B("help", 5, "{Ought to}: también es debería, consejo.", "en:You ought to help.", "Deberías ayudar.")])

scene("Q", G, "Q. Have to / Don't have to", "Necesario · no necesario",
      [("p", "{Have to} significa tener que. {Don't have to} significa que no es necesario; no quiere decir que esté prohibido."),
       ("ex", "I have to do my homework.", "Tengo que hacer la tarea."),
       ("ex", "I don't have to go today.", "No es necesario que vaya hoy.")],
      [B("homework", 1, "Tema Q: {have to} y {don't have to}.", "{Have to} significa tener que.",
         "{Don't have to} significa que no es necesario. No quiere decir que esté prohibido."),
       B("homework", 2, "en:I have to do my homework.", "Tengo que hacer la tarea."),
       B("relax", 3, "en:I don't have to go today.", "No es necesario que vaya hoy.")])

scene("R", G, "R. Must / Mustn't", "Obligación · prohibición",
      [("p", "{Must} expresa obligación. {Mustn't} expresa prohibición: algo que no se debe hacer."),
       ("ex", "You must be quiet.", "Debés estar en silencio."),
       ("ex", "You mustn't use your phone here.", "No debés usar el celular acá.")],
      [B("shh", 1, "Tema R: {must} y {mustn't}.", "{Must} expresa obligación.",
         "{Mustn't} expresa prohibición: algo que no se debe hacer."),
       B("shh", 2, "en:You must be quiet.", "Debés estar en silencio."),
       B("nophone", 3, "en:You mustn't use your phone here.", "No debés usar el celular acá.")])

scene("S", G, "S. Should / Shouldn't", "Consejos",
      [("p", "Se usa para dar consejos o decir qué sería conveniente hacer."),
       ("ex", "You should study.", "Deberías estudiar."),
       ("ex", "You shouldn't go to bed late.", "No deberías acostarte tarde.")],
      [B("advice", 1, "Tema S: {should} y {shouldn't}.", "Se usan para dar consejos, o decir qué sería conveniente hacer."),
       B("studying", 2, "en:You should study.", "Deberías estudiar."),
       B("late_bed", 3, "en:You shouldn't go to bed late.", "No deberías acostarte tarde.")])

scene("T", G, "T. First Conditional", "Posibilidad real",
      [("p", "¿Cuándo se usa? Para una situación posible en el futuro y su resultado."),
       ("st", "{IF} + {Present Simple},  {WILL} + verbo base"),
       ("ex", "If I study, I will pass the exam.", "Si estudio, aprobaré el examen."),
       ("ex", "If it rains, I will stay home.", "Si llueve, me quedaré en casa."),
       ("p", "{Unless} significa 'a menos que' y expresa una condición negativa."),
       ("ex", "Unless you hurry, you will miss the bus.", "A menos que te apures, perderás el colectivo.")],
      [B("ifthen", 1, "Tema T: el {First Conditional}.", "Se usa para una situación posible en el futuro, y su resultado."),
       B(None, 2, "Estructura: {if}, más {Present Simple}. Y después, {will}, más el verbo base."),
       B("exam", 3, "en:If I study, I will pass the exam.", "Si estudio, aprobaré el examen."),
       B("rain_home", 4, "en:If it rains, I will stay home.", "Si llueve, me quedaré en casa."),
       B("bus_run", 5, "{Unless} significa a menos que, y expresa una condición negativa."),
       B(None, 6, "en:Unless you hurry, you will miss the bus.", "A menos que te apures, perderás el colectivo.")])

scene("U", G, "U. Second Conditional", "Situación imaginaria",
      [("p", "¿Cuándo se usa? Para imaginar situaciones hipotéticas, poco probables o que no son reales ahora."),
       ("st", "{IF} + {Past Simple},  {WOULD} + verbo base"),
       ("ex", "If I were rich, I would travel.", "Si fuera rica, viajaría."),
       ("ex", "If I had a car, I would drive.", "Si tuviera un auto, manejaría."),
       ("tip", "Diferencia: {First Conditional} = posibilidad real. {Second Conditional} = imaginación o hipótesis.")],
      [B("dream", 1, "Tema U: el {Second Conditional}.",
         "Se usa para imaginar situaciones hipotéticas, poco probables, o que no son reales ahora."),
       B(None, 2, "Estructura: {if}, más {Past Simple}. Y después, {would}, más el verbo base."),
       B("dream_rich", 3, "en:If I were rich, I would travel.", "Si fuera rica, viajaría."),
       B("dream_car", 4, "en:If I had a car, I would drive.", "Si tuviera un auto, manejaría."),
       B("tip", 5, "Diferencia: {First Conditional}, posibilidad real. {Second Conditional}, imaginación o hipótesis.")])

scene("V", G, "V. Passive Voice", "Voz pasiva (presente y pasado)",
      [("p", "La voz pasiva se usa cuando importa más qué cosa recibe la acción que quién la hace."),
       ("st", "Present Passive: {am / is / are} + participio"),
       ("ex", "The room is cleaned every day.", "La habitación es limpiada todos los días."),
       ("st", "Past Passive: {was / were} + participio"),
       ("ex", "The cake was made yesterday.", "La torta fue hecha ayer."),
       ("p", "Compará — activa: {Someone cleans the room} (Alguien limpia la habitación). Pasiva: {The room is cleaned} (La habitación es limpiada).")],
      [B("clean", 1, "Tema V: la {Passive Voice}, voz pasiva, en presente y pasado.",
         "Se usa cuando importa más qué cosa recibe la acción, que quién la hace."),
       B(None, 3, "{Present Passive}: {am, is} o {are}, más el participio.", "en:The room is cleaned every day.",
         "La habitación es limpiada todos los días."),
       B("cake", 5, "{Past Passive}: {was} o {were}, más el participio.", "en:The cake was made yesterday.", "La torta fue hecha ayer."),
       B("clean", 6, "Compará. Activa:", "en:Someone cleans the room.", "Alguien limpia la habitación. Pasiva:",
         "en:The room is cleaned.", "La habitación es limpiada.")])

# ---------------------------------------------------------------- EJEMPLOS EXTRA (gramática)
EXTRA = {
    "A": [("He drinks coffee every morning.", "Él toma café todas las mañanas.", "more_ex"),
          ("We don't work on Sundays.", "No trabajamos los domingos.", "relax"),
          ("Do they live in Buenos Aires?", "¿Ellos viven en Buenos Aires?", "more_ex")],
    "B": [("He is reading a book right now.", "Él está leyendo un libro justo ahora.", "studying"),
          ("We are not watching TV at the moment.", "No estamos mirando televisión en este momento.", "tv_no"),
          ("Are you listening to music?", "¿Estás escuchando música?", "more_ex")],
    "C": [("She usually walks to work, but today she is driving.",
           "Ella generalmente camina al trabajo, pero hoy está manejando.", "dream_car"),
          ("He never cooks, but right now he is cooking!", "Él nunca cocina, ¡pero justo ahora está cocinando!", "cake")],
    "D": [("We visited the museum last week.", "Visitamos el museo la semana pasada.", "more_ex"),
          ("She didn't go to school yesterday.", "Ella no fue a la escuela ayer.", "yesterday"),
          ("Did they play football two days ago?", "¿Jugaron al fútbol hace dos días?", "playing")],
    "E": [("She was reading when I arrived.", "Ella estaba leyendo cuando llegué.", "arrive"),
          ("We were walking in the park when it started to rain.",
           "Estábamos caminando en el parque cuando empezó a llover.", "rain"),
          ("Were you sleeping at ten o'clock?", "¿Estabas durmiendo a las diez?", "sleeping")],
    "F": [("He used to play football every day.", "Antes jugaba al fútbol todos los días.", "football"),
          ("We didn't use to have a car.", "Antes no teníamos auto.", "more_ex"),
          ("Did she use to live here?", "¿Ella vivía acá antes?", "usedto_q")],
    "G": [("We are going to visit my grandma on Sunday.", "Vamos a visitar a mi abuela el domingo.", "friends"),
          ("He is not going to play today.", "Él no va a jugar hoy.", "noplay"),
          ("Are you going to watch the film?", "¿Vas a ver la película?", "tv_q")],
    "H": [("We are having dinner with my parents tonight.", "Esta noche cenamos con mis padres.", "agenda"),
          ("They are flying to Brazil on Monday.", "Ellos vuelan a Brasil el lunes.", "travel"),
          ("What are you doing on Saturday?", "¿Qué hacés el sábado?", "friends")],
    "I": [("I think you will love this song.", "Creo que te va a encantar esta canción.", "entertainment"),
          ("Don't worry, I won't tell anybody.", "No te preocupes, no le voy a contar a nadie.", "shh"),
          ("It's cold. I'll close the window.", "Hace frío. Cierro la ventana.", "more_ex")],
    "J": [("We have seen this film.", "Hemos visto esta película.", "tv"),
          ("He has never been to Paris.", "Él nunca ha estado en París.", "paris"),
          ("Have you ever eaten sushi?", "¿Alguna vez comiste sushi?", "eaten")],
    "K": [("She has read this book.", "Ella ha leído este libro.", "experience"),
          ("She read this book two years ago.", "Ella leyó este libro hace dos años.", "yesterday"),
          ("Have you seen the new film? Yes, I saw it yesterday.", "¿Viste la película nueva? Sí, la vi ayer.", "tv")],
    "L": [("The film has just started.", "La película acaba de empezar.", "tv"),
          ("We have already finished the exercise.", "Ya terminamos el ejercicio.", "cheer"),
          ("Has he called you yet?", "¿Ya te llamó?", "nobody_called"),
          ("She hasn't arrived yet.", "Ella todavía no llegó.", "more_ex")],
    "M": [("They have been playing football since three o'clock.", "Están jugando al fútbol desde las tres.", "playing"),
          ("It has been raining all morning.", "Estuvo lloviendo toda la mañana.", "rain"),
          ("How long have you been learning English?", "¿Hace cuánto que estudiás inglés?", "long_study")],
    "N": [("There is something in my bag.", "Hay algo en mi bolso.", "box_want"),
          ("I didn't buy anything.", "No compré nada.", "box_empty"),
          ("Nobody knows the answer.", "Nadie sabe la respuesta.", "thinker"),
          ("Can anybody help me?", "¿Alguien me puede ayudar?", "help")],
    "O": [("A plane is faster than a car.", "Un avión es más rápido que un auto.", "travel"),
          ("This book is more interesting than that one.", "Este libro es más interesante que ese.", "read"),
          ("It is the best day of my life!", "¡Es el mejor día de mi vida!", "cheer")],
    "P": [("You must stop at a red light.", "Debés frenar en el semáforo en rojo.", "more_ex"),
          ("She has to wake up early.", "Ella tiene que levantarse temprano.", "sleeping_she"),
          ("You should drink more water.", "Deberías tomar más agua.", "advice"),
          ("We ought to be careful.", "Deberíamos tener cuidado.", "helmet")],
    "Q": [("Students have to wear a uniform.", "Los estudiantes tienen que usar uniforme.", "homework"),
          ("You don't have to bring food. We have a lot.", "No hace falta que traigas comida. Tenemos mucha.", "relax"),
          ("Does he have to work tomorrow?", "¿Él tiene que trabajar mañana?", "working")],
    "R": [("You must do your homework.", "Debés hacer la tarea.", "homework"),
          ("You mustn't run in the hospital.", "No debés correr en el hospital.", "shh"),
          ("We mustn't be late.", "No debemos llegar tarde.", "bus_run")],
    "S": [("You should sleep eight hours.", "Deberías dormir ocho horas.", "sleeping"),
          ("He shouldn't eat so much sugar.", "Él no debería comer tanta azúcar.", "cake"),
          ("Should I call her?", "¿Debería llamarla?", "advice")],
    "T": [("If you call me, I will answer.", "Si me llamás, te voy a contestar.", "more_ex"),
          ("If we don't hurry, we will be late.", "Si no nos apuramos, vamos a llegar tarde.", "bus_run"),
          ("She will be happy if you visit her.", "Ella va a estar feliz si la visitás.", "friends")],
    "U": [("If I had more time, I would learn French.", "Si tuviera más tiempo, aprendería francés.", "dream"),
          ("If she lived near the beach, she would swim every day.",
           "Si viviera cerca de la playa, nadaría todos los días.", "travel_vocab"),
          ("What would you do if you won the lottery?", "¿Qué harías si ganaras la lotería?", "dream_rich")],
    "V": [("English is spoken all over the world.", "El inglés se habla en todo el mundo.", "more_ex"),
          ("The letters were sent last week.", "Las cartas fueron enviadas la semana pasada.", "more_ex"),
          ("The museum is visited by many people.", "El museo es visitado por mucha gente.", "places")],
}
for _sc in SCENES:
    if _sc["id"] in EXTRA:
        n = len(_sc["items"])
        _sc["items"].append(("hdr", "Más ejemplos"))
        _sc["beats"].append(B("more_ex", n + 1, "Veamos más ejemplos."))
        for _i, (_en, _es, _v) in enumerate(EXTRA[_sc["id"]]):
            _sc["items"].append(("ex", _en, _es))
            _sc["beats"].append(B(_v, n + 2 + _i, "en:" + _en, _es))

# ---------------------------------------------------------------- 3. RESUMEN
SUM = [
    ("Present Simple", "verbo / {doesn't} + verbo", "rutina", "{Present Simple}: verbo, o {doesn't} más verbo. Idea: rutina."),
    ("Present Continuous", "{am/is/are} + {-ing}", "ahora", "{Present Continuous}: {am, is, are}, más {ing}. Idea: ahora."),
    ("Past Simple", "verbo en pasado / {did}", "pasado terminado", "{Past Simple}: verbo en pasado, o {did}. Idea: pasado terminado."),
    ("Past Continuous", "{was/were} + {-ing}", "estaba pasando", "{Past Continuous}: {was, were}, más {ing}. Idea: estaba pasando."),
    ("Used to", "{used to} + verbo", "antes lo hacía", "{Used to}, más verbo. Idea: antes lo hacía."),
    ("Going to", "{am/is/are} + {going to} + verbo", "plan futuro", "{Going to}: {am, is, are}, más {going to}, más verbo. Idea: plan futuro."),
    ("Will", "{will / won't} + verbo", "predicción, promesa o decisión", "{Will}: {will} o {won't}, más verbo. Idea: predicción, promesa o decisión."),
    ("Present Perfect", "{have/has} + participio", "experiencia o conexión con ahora", "{Present Perfect}: {have, has}, más participio. Idea: experiencia, o conexión con ahora."),
    ("Present Perfect Continuous", "{have/has been} + {-ing}", "duración de una actividad", "{Present Perfect Continuous}: {have, has been}, más {ing}. Idea: duración de una actividad."),
    ("First Conditional", "{if} + presente, {will} + verbo", "posibilidad futura", "{First Conditional}: {if} más presente, {will} más verbo. Idea: posibilidad futura."),
    ("Second Conditional", "{if} + pasado, {would} + verbo", "situación imaginaria", "{Second Conditional}: {if} más pasado, {would} más verbo. Idea: situación imaginaria."),
    ("Present Passive", "{am/is/are} + participio", "pasiva en presente", "{Present Passive}: {am, is, are}, más participio. Pasiva en presente."),
    ("Past Passive", "{was/were} + participio", "pasiva en pasado", "{Past Passive}: {was, were}, más participio. Pasiva en pasado."),
]
scene("summary", "PARTE 3", "3. RESUMEN RÁPIDO", "Para memorizar",
      [("sum", a, b, c) for a, b, c, _ in SUM],
      [B("summary", 0, "Parte tres: resumen rápido para memorizar.")] +
      [B(None, i + 1, say) for i, (_, _, _, say) in enumerate(SUM)],
      big_title=True)

# ---------------------------------------------------------------- 4. DIFERENCIAS
DIF = [
    ("{Present Simple} / {Present Continuous}: hábito o rutina / acción que ocurre ahora.",
     "{Present Simple}: hábito o rutina. {Present Continuous}: acción que ocurre ahora."),
    ("{Past Simple} / {Past Continuous}: acción terminada / acción que estaba ocurriendo.",
     "{Past Simple}: acción terminada. {Past Continuous}: acción que estaba ocurriendo."),
    ("{Going to} / {Will}: plan decidido antes / predicción, promesa o decisión del momento.",
     "{Going to}: plan decidido antes. {Will}: predicción, promesa, o decisión del momento."),
    ("{Present Perfect} / {Past Simple}: experiencia sin momento terminado específico / acción en un momento pasado concreto.",
     "{Present Perfect}: experiencia sin momento terminado específico. {Past Simple}: acción en un momento pasado concreto."),
    ("{Mustn't} / {Don't have to}: está prohibido / no es necesario.",
     "{Mustn't}: está prohibido. {Don't have to}: no es necesario."),
    ("{Should} / {Must}: consejo / obligación.", "{Should}: consejo. {Must}: obligación."),
    ("{First} / {Second Conditional}: posibilidad real / situación imaginaria.",
     "{First Conditional}: posibilidad real. {Second Conditional}: situación imaginaria."),
]
scene("diff", "PARTE 4", "4. DIFERENCIAS QUE TENÉS QUE SABER", "Siete pares clave",
      [("bul", "• " + a) for a, _ in DIF],
      [B("versus", 0, "Parte cuatro: diferencias que tenés que saber.")] +
      [B(None, i + 1, say) for i, (_, say) in enumerate(DIF)],
      big_title=True)

# ---------------------------------------------------------------- 5. PRACTICA
scene("practice", "PARTE 5", "5. PRÁCTICA", "Elegí la opción correcta",
      [("p", "Elegí la opción correcta."), ("tip", "Pensá tu respuesta antes de que aparezca la solución.")],
      [B("thinker", 1, "Parte cinco: práctica. Elegí la opción correcta."),
       B(None, 2, "Pensá tu respuesta antes de que aparezca la solución.")],
      big_title=True)

QUIZ = [
    ("She _____ to school every day.", ["go", "goes", "going"], 1, None, "She goes to school every day."),
    ("I _____ TV right now.", ["watch", "am watching", "watched"], 1, None, "I am watching TV right now."),
    ("Yesterday, we _____ a film.", ["see", "saw", "seen"], 1, None, "Yesterday, we saw a film."),
    ("They _____ football when it started to rain.", ["played", "were playing", "are playing"], 1, None,
     "They were playing football when it started to rain."),
    ("I _____ visit my grandma tomorrow.", ["am going to", "will to", "going"], 0, "Ya es un plan.",
     "I am going to visit my grandma tomorrow."),
    ("I have _____ finished my homework.", ["yet", "just", "nothing"], 1, "Acabo de terminar.",
     "I have just finished my homework."),
    ("If I study, I _____ pass.", ["would", "will", "was"], 1, None, "If I study, I will pass."),
    ("If I were rich, I _____ travel.", ["will", "would", "am"], 1, None, "If I were rich, I would travel."),
    ("You _____ smoke here.", ["don't have to", "mustn't", "should"], 1, "Está prohibido.", "You mustn't smoke here."),
    ("The house _____ cleaned every day.", ["is", "are", "was"], 0, None, "The house is cleaned every day."),
]
NUMS = ["uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez"]
for i, (q, opts, ans, hint, full) in enumerate(QUIZ):
    spoken_q = q.replace("_____", "...")
    say_opts = ", ".join(opts[:-1]) + ", or " + opts[-1] + "?"
    pre = ["Número %s." % NUMS[i], "en:" + spoken_q, "en:" + say_opts]
    if hint:
        pre.append("Pista: " + hint.lower().rstrip(".") + ".")
    scene("q%d" % (i + 1), "5 · PRÁCTICA", "Pregunta %d de 10" % (i + 1), hint or "Elegí la opción correcta",
          [("quiz", q, opts, ans, full)],
          [B("think", 1, *pre),
           B("countdown", 1, "pause:3.2"),
           B("cheer", 2, "Respuesta:", "en:" + opts[ans] + ".", "en:" + full)],
          quiz=True)

scene("answers", "5 · PRÁCTICA", "Respuestas", "¿Cuántas acertaste?",
      [("p", "1) {goes} · 2) {am watching} · 3) {saw} · 4) {were playing} · 5) {am going to} · 6) {just} · 7) {will} · 8) {would} · 9) {mustn't} · 10) {is}"),
       ("tip", "Si te equivocaste, no pasa nada: volvé a la explicación de ese tema y fijate qué palabra te daba la pista.")],
      [B("cheer", 1, "Repasemos las respuestas: uno, {goes}. Dos, {am watching}. Tres, {saw}. Cuatro, {were playing}. Cinco, {am going to}.",
         "Seis, {just}. Siete, {will}. Ocho, {would}. Nueve, {mustn't}. Diez, {is}."),
       B("oops", 2, "Si te equivocaste, no pasa nada: volvé a la explicación de ese tema, y fijate qué palabra te daba la pista.")])

# ---------------------------------------------------------------- 6. COMO ESTUDIAR
scene("study", "PARTE 6", "6. CÓMO ESTUDIAR ESTA GUÍA", "Paso a paso",
      [("bul", "• Primero aprendé el vocabulario por grupos, de a 8 o 10 palabras."),
       ("bul", "• Después estudiá las estructuras del resumen rápido."),
       ("bul", "• Practicá diciendo en voz alta qué significa cada ejemplo."),
       ("bul", "• Para reconocer los tiempos, buscá pistas como {now, every day, yesterday, tomorrow, since} y {for}."),
       ("bul", "• Al final, resolvé los ejercicios sin mirar las respuestas."),
       ("tip", "Consejo: no intentes memorizar todas las explicaciones palabra por palabra. Lo más importante es entender cuándo se usa cada tema y reconocer cómo se forma la oración.")],
      [B("groups", 1, "Parte seis: cómo estudiar esta guía.", "Primero, aprendé el vocabulario por grupos, de a ocho o diez palabras."),
       B("summary", 2, "Después, estudiá las estructuras del resumen rápido."),
       B("aloud", 3, "Practicá diciendo en voz alta qué significa cada ejemplo."),
       B("clues", 4, "Para reconocer los tiempos, buscá pistas como {now, every day, yesterday, tomorrow, since} y {for}."),
       B("thinker", 5, "Al final, resolvé los ejercicios sin mirar las respuestas."),
       B("idea", 6, "Consejo: no intentes memorizar todas las explicaciones palabra por palabra.",
         "Lo más importante es entender cuándo se usa cada tema, y reconocer cómo se forma la oración.")],
      big_title=True)

# ---------------------------------------------------------------- THE LAST OF US
TLOU = [
    ("The Last of Us is a famous game", "The Last of Us es un juego famoso", "tl_title"),
    ("where a bad fungus makes people sick,", "donde un hongo malo enferma a las personas.", "tl_fungus"),
    ("sick people attack healthy people,", "Las personas enfermas atacan a las personas sanas.", "tl_attack"),
    ("the world becomes a dangerous place,", "El mundo se vuelve un lugar peligroso.", "tl_world"),
    ("Joel is a strong man,", "Joel es un hombre fuerte.", "tl_joel"),
    ("Ellie is a smart young girl with a special body that the fungus does not hurt,",
     "Ellie es una chica joven e inteligente, con un cuerpo especial al que el hongo no le hace daño.", "tl_ellie"),
    ("Joel and Ellie walk through old cities,", "Joel y Ellie caminan por ciudades viejas.", "tl_walk"),
    ("bad groups fight for food and guns,", "Grupos malos pelean por comida y armas.", "tl_groups"),
    ("players look for food, water, and items,", "Los jugadores buscan comida, agua y objetos.", "tl_search"),
    ("players hide from loud monsters,", "Los jugadores se esconden de monstruos ruidosos.", "tl_hide"),
    ("clickers find people by sound,", "Los clickers encuentran a las personas por el sonido.", "tl_clicker"),
    ("Joel and Ellie become good friends,", "Joel y Ellie se hacen buenos amigos.", "tl_friends"),
    ("and many people love this great game.", "Y mucha gente ama este gran juego.", "tl_love"),
]
scene("tlou", "TEXTO FINAL", "THE LAST OF US", "Un texto en inglés sobre el juego",
      [("ex", en, es) for en, es, _ in TLOU],
      [B("tl_title", 0, "Y para terminar, un texto en inglés que explica el juego {The Last of Us}.",
         "Escuchá cada frase en inglés, y después su traducción.")] +
      [B(v, i + 1, "en:" + en.rstrip(",.") + ".", es) for i, (en, es, v) in enumerate(TLOU)],
      dark=True, big_title=True)

TLOU_FULL = ("The Last of Us is a famous game where a bad fungus makes people sick, sick people attack healthy people, "
             "the world becomes a dangerous place, Joel is a strong man, Ellie is a smart young girl with a special body "
             "that the fungus does not hurt, Joel and Ellie walk through old cities, bad groups fight for food and guns, "
             "players look for food, water, and items, players hide from loud monsters, clickers find people by sound, "
             "Joel and Ellie become good friends, and many people love this great game.")
scene("tlou_full", "TEXTO FINAL", "THE LAST OF US", "Escuchá el texto completo",
      [("full", TLOU_FULL)],
      [B("tl_duo", 1, "Ahora, escuchá el texto completo.")] +
      [B(None, 1, "en:" + en) for en, _, _ in TLOU],
      dark=True, full_text=True)

scene("outro", "FIN", "¡A ESTUDIAR!", "Guía de estudio – Inglés",
      [("bul", "1. Vocabulary  ·  2. Grammar  ·  3. Resumen"),
       ("bul", "4. Diferencias  ·  5. Práctica  ·  6. Cómo estudiar"),
       ("bul", "+ The Last of Us")],
      [B("outro", 3, "¡Y eso es todo! Repasá la guía, practicá en voz alta, y mucha suerte con tu estudio. ¡Chau!")],
      big_title=True)
