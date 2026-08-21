# DevOps Calculator

A fully functional calculator web application built for learning **Docker**, **GitHub Actions**, **Trivy**, **Docker Hub**, and **AWS EC2** deployment. The app is a static site served by **Nginx** inside a Docker container — no backend, no frameworks.

![Calculator](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20JS-blue)
![Docker](https://img.shields.io/badge/server-Nginx%20%2B%20Docker-blue)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-green)

---

## 1. Project Overview 

This project demonstrates a complete DevOps workflow:

```
Browser → EC2 :80 → Docker Container :80 → Nginx → Calculator (HTML/CSS/JS)
```

Push code to GitHub, and the pipeline automatically builds, scans, publishes, and deploys the calculator to EC2.

---

## 2. Features

### Calculator
- Addition, subtraction, multiplication, division
- Percentage, decimals, chained calculations
- AC (clear), DEL (delete last character)
- Division-by-zero and invalid input handling
- Full keyboard support
- Realistic physical-calculator UI with LCD-style display
- Responsive design for mobile and desktop

### DevOps Pipeline
- Automated file and markup validation
- Docker image build and local smoke test
- Trivy security scan (HIGH and CRITICAL vulnerabilities)
- Push to Docker Hub with `latest` and commit SHA tags
- SSH deployment to AWS EC2
- Post-deployment HTTP smoke test

---

## 3. Technologies Used

| Layer | Technology |
|-------|------------|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Web Server | Nginx (Alpine) |
| Container | Docker |
| CI/CD | GitHub Actions |
| Security Scan | Trivy (`aquasecurity/trivy-action`) |
| Registry | Docker Hub |
| Deployment | AWS EC2 |

---

## 4. Project Structure

```
calculator-devops/
├── index.html              # Calculator markup
├── style.css               # Calculator styling
├── script.js               # Calculator logic
├── Dockerfile              # Nginx-based container image
├── .dockerignore           # Files excluded from Docker build
├── README.md               # This file
└── .github/
    └── workflows/
        └── pipeline.yml    # CI/CD pipeline
```

---

## 5. Run Locally (Without Docker)

Open `index.html` directly in your browser, or serve it with any static file server:

```bash
# Python 3
python -m http.server 8000
```

Then visit: http://localhost:8000

---

## 6. Docker Commands

### Build

```bash
docker build -t calculator-devops .
```

### Run

```bash
docker run -d -p 8080:80 --name calculator-devops calculator-devops
```

### Open

http://localhost:8080

### Stop

```bash
docker stop calculator-devops
```

### Remove

```bash
docker rm calculator-devops
```

### Useful inspection commands

```bash
docker images
docker ps
docker ps -a
docker logs calculator-devops
```

---

## 7. GitHub Repository Setup

1. Create a new repository on GitHub (e.g. `calculator-devops`).
2. Initialize git locally and push:

```bash
git init
git add .
git commit -m "Initial commit: DevOps calculator with CI/CD pipeline"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/calculator-devops.git
git push -u origin main
```

3. The GitHub Actions workflow triggers on:
   - **Push** to `main` → full pipeline including deploy
   - **Pull request** to `main` → build, test, and Trivy scan only

---

## 8. Docker Hub Setup

1. Create a free account at [hub.docker.com](https://hub.docker.com).
2. Create an **Access Token** under **Account Settings → Security**.
3. Store the token as a GitHub secret (see section 9).

The pipeline pushes images as:

```
YOUR_DOCKERHUB_USERNAME/calculator-devops:latest
YOUR_DOCKERHUB_USERNAME/calculator-devops:<commit-sha>
```

---

## 9. Required GitHub Secrets

Create these secrets in your GitHub repository under **Settings → Secrets and variables → Actions → New repository secret**:

| Secret Name | Description |
|-------------|-------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token (not your password) |
| `EC2_HOST` | Public IP or hostname of your EC2 instance |
| `EC2_USERNAME` | SSH username (e.g. `ubuntu` or `ec2-user`) |
| `EC2_SSH_KEY` | Private SSH key contents for EC2 access |

> **Do not commit real credentials.** These are referenced in the workflow as:
>
> ```
> ${{ secrets.DOCKERHUB_USERNAME }}
> ${{ secrets.DOCKERHUB_TOKEN }}
> ${{ secrets.EC2_HOST }}
> ${{ secrets.EC2_USERNAME }}
> ${{ secrets.EC2_SSH_KEY }}
> ```

---

## 10. How Trivy Works in This Project

[Trivy](https://github.com/aquasecurity/trivy) scans the built Docker image for known vulnerabilities in OS packages and libraries.

In `.github/workflows/pipeline.yml`:

- Uses the official `aquasecurity/trivy-action@0.28.0`
- Scans the locally built image **before** pushing to Docker Hub
- Checks for **HIGH** and **CRITICAL** severity issues
- Fails the pipeline (`exit-code: 1`) if vulnerabilities are found

You do **not** need Trivy installed locally — it runs entirely inside GitHub Actions.

---

## 11. EC2 Requirements

Your EC2 instance should have:

| Requirement | Details |
|-------------|---------|
| OS | Amazon Linux 2, Ubuntu, or similar |
| Docker | Installed and running |
| Security Group | Inbound **HTTP (port 80)** open to `0.0.0.0/0` (or your IP) |
| SSH | Port 22 open for GitHub Actions deployment |
| IAM | Not required for basic Docker Hub pull |

### EC2 setup commands (run once on the instance)

```bash
# Ubuntu example
sudo apt update
sudo apt install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

Log out and back in so the Docker group membership takes effect.

---

## 12. How the CI/CD Pipeline Works

```
GitHub Push (main)
       ↓
  Checkout code
       ↓
  Validate files (index.html, style.css, script.js)
       ↓
  Verify calculator HTML markup
       ↓
  Verify no eval() in JavaScript
       ↓
  Docker build
       ↓
  Run container locally in CI
       ↓
  Test with curl (HTTP 200)
       ↓
  Stop/remove test container
       ↓
  Trivy security scan (HIGH, CRITICAL)
       ↓
  Docker Hub login          ← main branch only
       ↓
  Push image (latest + SHA) ← main branch only
       ↓
  SSH into EC2              ← main branch only
       ↓
  Pull latest image
       ↓
  Stop old container
       ↓
  Remove old container
       ↓
  Run new container (port 80:80)
       ↓
  Test deployed app (curl EC2)
```

---

## 13. Deployment Flow

After a successful push to `main`:

1. GitHub Actions builds and tests the Docker image.
2. Trivy scans it for vulnerabilities.
3. The image is pushed to Docker Hub as `latest` and `<commit-sha>`.
4. GitHub Actions SSHs into EC2 and runs:

```bash
docker pull YOUR_USERNAME/calculator-devops:latest
docker stop calculator-devops || true
docker rm calculator-devops || true
docker run -d -p 80:80 --name calculator-devops --restart unless-stopped \
  YOUR_USERNAME/calculator-devops:latest
```

5. A final curl test confirms the app responds at `http://YOUR_EC2_IP`.

Visit **http://YOUR_EC2_PUBLIC_IP** in your browser to use the deployed calculator.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `0-9` | Number input |
| `+ - * /` | Operators |
| `%` | Percentage |
| `Enter` or `=` | Equals |
| `Escape` | Clear (AC) |
| `Backspace` | Delete last character |
| `.` | Decimal point |

---

## License


This is a learning project. Use it freely for education and experimentation.
