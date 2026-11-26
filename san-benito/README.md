# San Benito — Tu mejor elección

Sitio web de San Benito (Las Catitas y La Dormida): productos reales en 3D sobre un mostrador giratorio, góndola con buscador y filtros, ofertas, afiches de promociones, pasillos y un ticket de papel térmico que arma el pedido para enviarlo por WhatsApp.

- Colores: azul lapislázuli (con textura de piedra y pirita), oro metálico y carmesí, sobre marfil.
- Tipografías: Cormorant Garamond (títulos), Jost (texto) y Courier Prime (ticket).
- Animaciones con Animate UI (Motion), GSAP ScrollTrigger y React Three Fiber.
- Sonidos hechos con earshot (sin licencias): agregar y quitar productos, abrir y cerrar el ticket, enviar el pedido. Se apagan desde el menú.

## Cómo verlo en tu computadora

Necesitás [Node.js](https://nodejs.org) 20 o más nuevo.

```bash
cd san-benito
npm install
npm run dev
```

Abrí http://localhost:3000. Para editar, tocá las tres rayitas → **AGL**. En tu computadora, si no configuraste una contraseña, es `sanbenito`.

## AGL: el panel para editar todo

Menú de las tres rayitas → **AGL** → contraseña. Al terminar, tocá **Guardar cambios**: el sitio se actualiza al instante.

### Cambiar un precio

1. Pestaña **Productos y precios**.
2. Escribí el precio nuevo en el casillero dorado **Precio**.
3. **Guardar cambios**.

Atajos:

- **Subir o bajar muchos precios a la vez:** elegí un pasillo (o Todos), escribí el porcentaje (`10` sube 10 %, `-5` baja 5 %) y tocá **Aplicar**. Redondea a la decena.
- **Precio por cantidad** (como "2 por $2.690" o "3 kg por $9.990"): **Agregar precio por cantidad**, poné cuántas unidades y el precio total. El ticket aplica la mejor combinación sola.
- **Oferta con precio tachado:** escribí el precio de antes en **Precio antes (oferta)**.
- **Mostrar en Ofertas:** tildalo para que el producto aparezca en esa sección.

### Agregar un producto

1. **Agregar producto** (aparece arriba de la lista).
2. Completá nombre, presentación (ej. `500 g`), pasillo, precio y, si querés, una descripción.
3. **Subir foto**: desde el celular podés sacarla en el momento o elegirla de la galería. Para que se vea en 3D como las demás, usá una foto con el fondo transparente (PNG); con fondo se ve como foto rectangular.
4. **Envase 3D**: elegí la forma (lata o frasco = cilindro que gira; bolsa = paquete abultado; foto recortada = plana).
5. **Guardar cambios**.

### Borrar un producto

**Eliminar** en el producto y tocá de nuevo para confirmar. Después, **Guardar cambios**. La foto que ya no se usa se borra del servidor sola.

### Afiches de promociones

Pestaña **Afiches**: **Subir afiche**, ordenalos con **Antes/Después**, ponerles título o **Quitar**. Se ven en la sección "Promociones de la semana" y se agrandan con un toque.

### Lo demás

- **Pasillos:** nombre y color de cada uno.
- **Textos y secciones:** todos los títulos, textos y botones, los pasos de "Cómo comprar" y qué secciones se muestran.
- **Colores y fuentes:** los colores de la marca y las tipografías, con muestra en vivo.
- **Datos del negocio:** sucursales (con enlace al mapa), teléfono, WhatsApp, horarios, Instagram, Facebook y TikTok. Lo que quede vacío no aparece en el sitio.

Todo se guarda en `data/tienda.json`; las fotos en `data/imagenes/` y los afiches en `data/afiches/`.

## Vista previa sin servidor

```bash
npm run vista-previa
```

Genera en `vista-previa/dist/` una versión estática con los datos actuales, sin AGL (no hay servidor donde guardar).

## Publicar el sitio

```bash
npm run build
ADMIN_PASSWORD=tu-contraseña npm start
```

- En el sitio publicado, AGL pide la contraseña de `ADMIN_PASSWORD`. Sin esa variable no se puede editar (no hay contraseña por defecto).
- AGL guarda en archivos del servidor (`data/`), así que el sitio tiene que correr en un servidor con disco propio (un VPS o un servicio que permita escribir archivos, como Railway o Render con disco).
- En hostings de solo lectura (como Vercel), editá en tu computadora, tocá **Descargar copia**, reemplazá `data/tienda.json` y volvé a publicar.
