# San Benito — Tu mejor elección

Sitio web de la tienda San Benito: portada con productos en 3D sobre un mostrador giratorio, góndola con buscador y filtros por pasillo, recorrido por pasillos, ofertas y un ticket de caja que arma el pedido para enviarlo por WhatsApp.

Colores de la marca: azul lapislázuli, dorado y carmesí sobre marfil. Tipografías: Fraunces para títulos e Instrument Sans para el texto.

Hecho con Next.js, Tailwind CSS, React Three Fiber, GSAP ScrollTrigger y Framer Motion.

## Cómo verlo en tu computadora

Necesitás [Node.js](https://nodejs.org) 20 o más nuevo.

```bash
cd san-benito
npm install
npm run dev
```

Abrí http://localhost:3000 para ver la tienda y http://localhost:3000/admin para editar el sitio.
En tu computadora el panel no pide contraseña.

## Qué se puede editar desde el panel

Todo el contenido del sitio se edita en `/admin` (enlace "Administrar el sitio" al pie):

- **Productos y precios:** nombre, presentación, pasillo, precio, oferta, stock, si sale en la portada, tipo de envase 3D y colores.
- **Pasillos:** nombre y color de cada uno, agregar o quitar.
- **Textos y secciones:** todos los títulos, textos y botones, los pasos de "Cómo comprar" y qué secciones se muestran.
- **Colores y fuentes:** los cuatro colores de la marca y la tipografía de títulos y de texto, con una muestra en vivo.
- **Datos del negocio:** nombre, eslogan, WhatsApp, dirección, horarios, Instagram y moneda.

## Cómo actualizar los precios

1. Entrá a `/admin`.
2. Cambiá el precio en el casillero dorado de cada producto.
3. Tocá **Guardar cambios**. El sitio muestra los precios nuevos al instante.

En el panel también podés:

- **Poner un producto en oferta:** escribí el precio anterior en "Precio antes (oferta)". Aparece tachado, con el porcentaje de descuento, y el producto pasa a la sección Ofertas.
- **Subir o bajar varios precios a la vez:** elegí un pasillo (o todos), escribí un porcentaje (por ejemplo `10` o `-5`) y tocá **Aplicar**. Los precios se redondean a la decena.
- **Marcar sin stock**, elegir qué productos salen en la portada, agregar o eliminar productos y pasillos.
- **Cargar los datos del negocio:** WhatsApp, dirección, horarios e Instagram. Lo que quede vacío no se muestra. Con el WhatsApp cargado, el ticket se envía como pedido por WhatsApp.

Todo se guarda en `data/tienda.json`. Los precios que vienen cargados son de ejemplo: reemplazalos por los tuyos.

## Productos en 3D

Cada producto se dibuja en 3D a partir de su nombre, su presentación y sus colores, eligiendo un tipo de envase: frasco de vidrio, botella, lata, caja, cartón o bolsa. Si cambiás el nombre o los colores en el panel, el 3D se actualiza solo.

Si tenés un modelo 3D propio en formato `.glb`, copialo a `public/modelos/` y escribí su ruta en "Modelo 3D propio" (por ejemplo `/modelos/yerba.glb`). Si el archivo no carga, se muestra el envase dibujado.

## Vista previa sin servidor

```bash
npm run vista-previa
```

Genera en `vista-previa/dist/` una versión estática del sitio con los datos de `data/tienda.json`, sin el panel de administración. Sirve para mostrar cómo queda antes de publicarlo.

## Publicar el sitio

```bash
npm run build
ADMIN_PASSWORD=tu-contraseña npm start
```

- En el sitio publicado, `/admin` pide la contraseña de `ADMIN_PASSWORD`. Sin esa variable, el panel no deja editar.
- El panel guarda los cambios en el archivo `data/tienda.json` del servidor, así que el sitio tiene que correr en un servidor con disco propio (un VPS o un servicio que permita escribir archivos).
- En hostings de solo lectura (como Vercel), editá los precios en tu computadora, tocá **Descargar copia** en el panel, reemplazá `data/tienda.json` con ese archivo y volvé a publicar.
