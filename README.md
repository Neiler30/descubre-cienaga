# 🌴 TurisCam

Aplicación móvil desarrollada con **React Native + Expo** para explorar lugares turísticos de Ciénaga, Magdalena.
Incluye sistema de administración, QR interactivos, audioguías y estadísticas.

---

## 🚀 Tecnologías usadas

* React Native
* Expo
* TypeScript
* Supabase (Base de datos)
* Expo Router
* Expo FileSystem + Sharing
* Expo Image
* React Native Safe Area Context

---

## 📦 Instalación del proyecto

### 1. Clonar repositorio

```bash
git clone https://github.com/Neiler30/descubre-cienaga.git
cd descubre-cienaga
```

---

### 2. Instalar dependencias

```bash
npm install
```

---

### 3. Ejecutar proyecto

```bash
npx expo start
```

---

## 📱 Cómo probar la app

* Descargar **Expo Go** en el celular
* Escanear el QR que aparece en la terminal

---

## 🔐 Variables de entorno (IMPORTANTE)

Crear un archivo `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_SUPABASE_URL=TU_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=TU_KEY
```

---

## 🧑‍💻 Panel Admin

La app incluye un panel de administrador donde puedes:

* Crear lugares turísticos
* Editar información
* Eliminar (desactivar)
* Generar códigos QR
* Descargar QR
* Ver estadísticas

---

## 📂 Estructura del proyecto

```
/app
/components
/constants
/hooks
/services
/template
/assets
```

---

## ⚙️ Funcionalidades principales

* 📍 Lugares turísticos
* 🧾 Descripciones y audioguía
* 🧠 Experiencias AR (simuladas)
* 🎯 Sistema de puntos
* 🏷️ Etiquetas
* 📊 Estadísticas
* 🔑 Autenticación
* 🛠️ Panel Admin completo
* 📷 QR dinámicos descargables

---

## ⚠️ Notas importantes

* En web, la descarga de QR se abre en una pestaña nueva
* En móvil, se descarga y se puede compartir
* `FileSystem.cacheDirectory` solo funciona en dispositivos móviles

---

## 🧪 Problemas comunes

### ❌ "cacheDirectory es null"

👉 Estás en Web → es normal

### ❌ No conecta con Supabase

👉 Revisa `.env`

### ❌ Error al iniciar

👉 Ejecuta:

```bash
npm install
```

---

## 👨‍💻 Cómo contribuir

1. Crear una rama:

```bash
git checkout -b nueva-funcion
```

2. Hacer cambios
3. Subir cambios:

```bash
git add .
git commit -m "Nueva función"
git push origin nueva-funcion
```

---

## 📌 Recomendaciones

* Usar **VS Code**
* Instalar extensión:

  * ESLint
  * Prettier
* No subir `.env`

---

## 👑 Autor

Proyecto desarrollado por:

**Neiler**

---

## 💡 Futuras mejoras

* Integrar AR real
* Modo offline
* Mapas interactivos
* Gamificación avanzada
* Ranking de usuarios

---

## 📄 Licencia

desarrollado por Neyller castro.

---


