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

### Rules
Open-source contribution is a great way to encourage building and pooling talents from across the world. To make open-source contribution a safe and innovative space, kindly adhere to the [Code of Conduct](/CODE_OF_CONDUCT.md)

#### For Hacktoberfest Participants
Hacktoberfest is an incredible opportunity for first-time contributors to make impacting contributions to open-source projects. To keep the experience and quality of open-source contributions meaningful, here are some guidelines that should be considered before you make a contribution:

*Issues*
1. Any issue with the label `hacktoberfest` can be picked up for contributions. If an issue is not labelled as `hacktoberfest` or `up for grabs`, it means that one of the collaborators has determined that the issue is either too large or too complex for `hacktoberfest` contributors to resolve.
2. This repository will not accept low quality changes to the `README.md` file or any low quality documentation changes. In the past, many open-source projects have seen problems with first-time contributors creating spam PRs just for the sake of `hacktoberfest`, so it will not be encouraged here.
3. If an issue is already assigned to a contributor, another contributor may not work on it, unless a repository collaborator determines if the current contributor is unable to make meaningful contributions through the issue. If the issue is already assigned, the label `up for grabs` will be removed.
4. If a contributor has raised a bug, feature request or documentation change, only that contributor is entitled to work on the issue. Another contributor may collaborate with the contributor with their permission.

*Pull Requests*
1. While creating a PR for merging changes, the PR template must be properly filled. This helps the repository owners and code reviewer understand more about your contribution
2. Always link the existing issue to the PR, so that once the PR is merged, the issue is automatically resolved.
3. Vercel Preview Deployment will only be enabled for a PR when there is a change in the source code of the project. In cases like documentation changes, a Vercel Preview Deployment is not required.
4. For changes to how the Firebase-Firestore database handles collections or documents, make sure to also include your changes of the Firestore Rules in the `firestore.rules` file, so that there no issues while deploying the project to production

Thank you for your contributions! We appreciate your efforts to help improve Shiksha AI.
