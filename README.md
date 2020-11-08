# Servidor CMS de Bughound

# Instrucciones

## 1 - Instalacion de NodeJS

### Ubuntu Linux:
```
sudo apt update
sudo apt -y install curl dirmngr apt-transport-https lsb-release ca-certificates
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
```

### MacOS:

```
brew node
```

### Windows:
Descargar el instalable desde https://nodejs.org/es/download/


## 2 - Descargar proyecto

### Utilizando Git

```
git clone https://github.com/Bughound/servidor_tesina.git
```

Tambien puede ser descargado directamente como un archivo zip clickeando sobre el boton verde que se encuentra a la izquierda.

## 3 - Instalando paquetes

Dentro del directorio del proyecto ejecutar el comando `npm install`

## 4 - Iniciar el servidor

`npm run develop`

## Panel de administracion

http://localhost:1337/admin/

Usuario: `admin`

Contraseña: `123456`
