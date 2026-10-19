# Publicar la app y ponerla en el iPhone

Es gratis y se hace una sola vez. Unos 15 minutos.

Ya está todo preparado: la carpeta es un repositorio de git con el primer "commit" hecho.
Solo falta crear tu cuenta, subirlo y encender GitHub Pages.

---

## 1. Crear la cuenta de GitHub (si no la tienes)
1. Entra en **github.com** y pulsa **Sign up**.
2. Pon tu correo, una contraseña y un nombre de usuario. Apúntate el nombre de usuario: lo vas a necesitar.
3. Confirma el correo que te mandan.

## 2. Crear el repositorio
1. Ya dentro de GitHub, arriba a la derecha, pulsa **+** › **New repository**.
2. **Repository name:** `chino`
3. Déjalo en **Public**. (Con cuenta gratuita, las webs solo funcionan en repositorios públicos. Se ve el código, no tu progreso: ese se queda en tu móvil.)
4. **No** marques nada de "Add a README", "Add .gitignore" ni licencia.
5. Pulsa **Create repository**.

## 3. Subir la carpeta
1. Abre la carpeta `ChinoApp` en el Explorador.
2. Haz clic en la barra de direcciones, escribe `cmd` y pulsa Intro.
3. Copia y pega esto, **cambiando TUUSUARIO por tu nombre de usuario de GitHub**:

```
git remote add origin https://github.com/TUUSUARIO/chino.git
git push -u origin main
```

4. Se abrirá una ventana del navegador para que entres en GitHub. Dale a **Authorize** / **Sign in**.
5. Cuando termine, actualiza la página de GitHub: ya están ahí todos los archivos.

> Si te dice `remote origin already exists`, usa esto y vuelve a intentarlo:
> `git remote set-url origin https://github.com/TUUSUARIO/chino.git`

## 4. Encender la web (GitHub Pages)
1. En tu repositorio, pulsa **Settings** (arriba).
2. En la columna de la izquierda, **Pages**.
3. En **Source**, elige **Deploy from a branch**.
4. En **Branch**, elige **main** y la carpeta **/ (root)**. Pulsa **Save**.
5. Espera un minuto y recarga. Arriba te saldrá la dirección:

```
https://TUUSUARIO.github.io/chino/
```

## 5. Instalarla en el iPhone
1. Abre esa dirección **en Safari** (no en Chrome: lo de "añadir a pantalla de inicio" solo va bien en Safari).
2. Pulsa el botón de **compartir** (el cuadradito con la flecha hacia arriba).
3. Baja y pulsa **Añadir a pantalla de inicio**.
4. Dale un nombre (viene "Chino") y pulsa **Añadir**.
5. Ya tienes el icono. Ábrelo desde ahí: se ve a pantalla completa, sin barras.

La primera vez, ábrela con internet para que se guarde entera. Después funciona sin conexión.

## 6. La voz china (una sola vez)
Si al darle a un botón de audio no suena nada:
**Ajustes del iPhone › Accesibilidad › Contenido leído › Voces › Chino (Taiwán)** y descarga una voz.
Luego vuelve a la app, Ajustes › Probar la voz.

## 7. El recordatorio diario
En la app: **Ajustes › Hora del recordatorio** (pon la tuya) y luego **Añadir al Calendario**.
Se descarga un archivo; tócalo y dale a **Añadir**. Crea un evento que se repite todos los días con su aviso.

---

## Cuando cambiemos algo de la app
En la ventana negra (`cmd`), dentro de la carpeta:

```
git add .
git commit -m "lo que hemos cambiado"
git push
```

En un minuto está actualizado en tu móvil. Si ves la versión vieja, cierra la app del todo y vuelve a abrirla
(hay que subir el número de `VERSION` en `sw.js` cada vez que cambie la app: de eso me encargo yo).

## Si algo falla
- **`git` no se reconoce:** reinicia el ordenador; Git ya está instalado.
- **Pide usuario y contraseña y no la acepta:** GitHub ya no usa contraseña en la terminal. Cierra, vuelve a `git push` y usa la ventana del navegador que se abre.
- **La web da 404:** espera dos minutos más; la primera vez tarda. Comprueba en Settings › Pages que pone "Your site is live at…".
- **En el iPhone no sale "Añadir a pantalla de inicio":** asegúrate de estar en Safari y de haber pulsado el botón de compartir.
