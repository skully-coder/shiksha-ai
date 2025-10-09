# CONTRIBUTING.md

## Contributing to Shiksha AI

Thank you for your interest in contributing to Shiksha AI! We welcome contributors to help us improve the project. Below are the guidelines and steps to get started.

### General Contribution Guidelines

1. **Fork the Repository**
   - Click on the “Fork” button at the top right of the repository page to create your own copy of the repository.

2. **Clone Your Fork**
   - Open your terminal and run the following command to clone your fork:
     ```bash
     git clone https://github.com/your-username/shiksha-ai.git
     ```
   - Replace `your-username` with your GitHub username.

3. **Create a New Branch**
   - Navigate to the directory of the cloned repository:
     ```bash
     cd shiksha-ai
     ```
   - Create a new branch for your changes:
     ```bash
     git checkout -b your-feature-branch
     ```

4. **Make Your Changes**
   - Make the necessary changes in your local repository.

5. **Commit Your Changes**
   - Stage your changes:
     ```bash
     git add .
     ```
   - Commit your changes with a meaningful message:
     ```bash
     git commit -m "Description of your changes"
     ```

6. **Push Your Changes**
   - Push your changes to your fork:
     ```bash
     git push origin your-feature-branch
     ```

7. **Create a Pull Request**
   - Go to the original repository and click on the “New Pull Request” button.
   - Select your branch and submit the pull request.

### Importing the Project into Firebase Studio for Development

1. **Set Up Firebase**
   - If you haven’t already, create a Firebase account and set up a new project in the Firebase console.
   - To make it easier to test the features, an Admin Console has been added to create teacher and student users in bulk, without needed to go through the Auth flow. 

2. **Import the Project**
   - In Firebase Studio, select the option to import an existing project.
   - Follow the on-screen instructions to connect your local repository to Firebase.

3. **Run the Project**
   - Ensure that you have all necessary dependencies installed.
   - Create a .env file using the .env.template file as template for the environment variables.
   - Make sure to set `NEXT_PUBLIC_DEV_MODE` to `true` for the development.
   - Start the development server and make sure everything works as expected.

### Conclusion

Thank you for your contributions! We appreciate your efforts to help improve Shiksha AI.
