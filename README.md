# Operator App - Setup and Run Guide

Welcome to the Operator App setup guide! This document will walk you through the steps required to get the application up and running on your local machine. Follow the instructions carefully to ensure a smooth setup process.
 
**Prerequisites**

-- Before you begin, ensure you have the following installed on your system:

1) Node.js (version v22.12.0 or higher recommended)

2) npm (Node Package Manager, usually installed with Node.js)

-- Installing Node.js and npm: 

If you don't have Node.js and npm installed, follow these steps:

-- Open your terminal or command prompt.
-- Run the following command to install Node.js and npm: 
```sudo apt-get install nodejs npm```
-- Verify that Node.js and npm are installed by running the following commands:
```node --version```
```npm --version```
--You should see the installed versions of Node.js and npm displayed in the terminal.


**Cloning the Repository**
1. Open your terminal or command prompt.
2. Navigate to the desired directory where you want to clone the repository.
3. clone the repository.
```git clone https://github.com/your-username/operator-app.git``` 
4. Navigate to the cloned repository directory.
```cd operator-app```


**Installing Dependencies**
1. Open your terminal or command prompt.
2. Navigate to the cloned repository directory.
3. Run the following command to install the project dependencies:
```npm install```


**Running the Application**
--After installing the dependencies, you can start the development server. This application is built using React + Vite.
1. Open your terminal or command prompt.
2. Navigate to the cloned repository directory.
3. Run the following command to start the application:
```npm run dev```
4.Open your browser and navigate to [http://localhost:5173/] or the link provided in the terminal.

**Docker Image**
- If you want to run the application in a Docker container, you can use the provided Dockerfile.
- The base API URL is passed as an environment variable (`API_BASE_URL`) at runtime.
- Build the Docker image: `docker build -t docker.nixbug.com/entebus/operator-app:main-a2923dd -t docker.nixbug.com/entebus/operator-app:main-latest .`
- Run the Docker container : `docker run -d -p 80:80 --name operator-app -e API_BASE_URL="https://api.entebus.com" docker.nixbug.com/entebus/operator-app:main-latest`.


**Running the Server on a Global Network Interface**
-- If you want to access the application from another device on the same network, you can run the server on a global network interface. Use the following command:
```npm run dev -- --host```
This will make the application accessible via your local IP address.


**Summary of Commands**
Here’s a quick summary of the commands you’ll need:

1. Install Node.js and npm: `sudo apt-get install nodejs npm`
2. Install dependencies: `npm install`
3. Clone the repository: `git clone https://github.com/your-username/operator-app.git`
4. Start the application: `npm run dev`
5. Run the server on a global network interface: `npm run dev -- --host`

**Troubleshooting**
- Port already in use: If the default port 5173 is already in use, Vite will automatically try the next available port. Check the terminal for the correct URL.
- Dependency issues: If you encounter issues during npm install, try deleting the node_modules folder and the package-lock.json file, then run npm install again.


**Additional Resources**
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://reactjs.org/)


**Notes**
- This setup guide assumes you have a basic understanding of Node.js and npm.
- Make sure to check out the [operator App GitHub repository](https://github.com/your-username/operator-app) for updates and additional information.
- Replace your-username in the repository URL with the actual username or organization name where the repository is hosted.



**Conclusion**
You should now have the operator App up and running on your local machine. If you encounter any issues, feel free to reach out for support.
 `Happy coding! `


**Thank you for using the Operator App setup guide!**