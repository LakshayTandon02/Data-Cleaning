<div align="center">

# 🧹 Data Cleaning Studio

### Transform Raw Data into Clean, Analysis-Ready Insights

A modern and interactive web application designed to upload, explore, clean, and prepare datasets for analysis.

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)

<br>

[About](#-about-the-project) •
[Features](#-key-features) •
[Workflow](#-application-workflow) •
[Tech Stack](#️-technology-stack) •
[Installation](#-getting-started)

</div>

---

## 📌 About the Project

**Data Cleaning Studio** is a modern web application that helps users upload, preview, explore, and prepare datasets through an interactive interface.

The application supports CSV and Excel files and provides an easy workflow for inspecting datasets before using them for data analysis, visualization, or machine-learning projects.

> 🎯 **Goal:** Make raw data easier to understand, organize, and prepare for better insights.

---

## 🔄 Application Workflow

```mermaid
flowchart LR
    A[Upload Dataset] --> B{Check File Type}
    B -->|CSV| C[Process CSV]
    B -->|Excel| D[Process Excel]
    C --> E[Generate Data Preview]
    D --> E
    E --> F[Inspect Dataset]
    F --> G[Apply Cleaning Actions]
    G --> H[Review Results]
    H --> I[Data Ready for Analysis]
```

### How It Works

1. **Upload Dataset** — Select a CSV or Excel file.
2. **File Processing** — The application reads and processes the uploaded file.
3. **Data Preview** — View dataset rows, columns, and information.
4. **Data Inspection** — Explore the dataset structure.
5. **Data Cleaning** — Apply the available cleaning operations.
6. **Final Review** — Review the processed dataset.

---

## ✨ Key Features

- 📁 Upload CSV and Excel datasets
- 👀 Preview dataset rows and columns
- 🔎 Explore dataset structure
- 🧹 Perform data-cleaning operations
- 📊 Review processed data
- ⚡ Fast performance with Vite
- 📱 Responsive and modern user interface

---

## 🏗️ Application Architecture

```mermaid
flowchart TD
    A[User] --> B[React User Interface]
    B --> C[Dataset Selector]
    C --> D{File Parser}
    D -->|CSV| E[CSV Processing]
    D -->|Excel| F[Excel Processing]
    E --> G[Dataset Data]
    F --> G
    G --> H[Data Preview]
    H --> I[Cleaning Interface]
    I --> J[Processed Dataset]
```

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| ⚛️ React | Building the interactive user interface |
| 🔷 TypeScript | Type-safe development |
| ⚡ Vite | Fast development and optimized builds |
| 📄 CSV Processing | Reading and processing CSV datasets |
| 📗 Excel Processing | Reading and processing Excel datasets |
| 🎨 CSS | Styling and responsive design |
| 🎯 Lucide React | Modern interface icons |

---

## 📂 Project Structure

```text
Data-Cleaning/
│
├── assets/
│   └── Images and application resources
│
├── src/
│   │
│   ├── components/
│   │   ├── DatasetSelector.tsx
│   │   └── Other reusable components
│   │
│   ├── data/
│   │   └── Application data
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Install the following:

- Node.js
- npm

Check the installation:

```bash
node -v
npm -v
```

### 1. Clone the Repository

```bash
git clone https://github.com/LakshayTandon02/Data-Cleaning.git
```

### 2. Open the Project Folder

```bash
cd Data-Cleaning
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

The terminal will show a local URL similar to:

```text
http://localhost:5173/
```

Open the displayed URL in your browser.

---

## 📋 Supported File Formats

| File Type | Extension | Status |
|---|---|---:|
| CSV | `.csv` | ✅ Supported |
| Microsoft Excel | `.xlsx` | ✅ Supported |
| Legacy Excel | `.xls` | ✅ Supported |

---

## 🎯 Use Cases

```mermaid
flowchart TD
    A[Raw Dataset] --> B[Data Exploration]
    B --> C[Data Cleaning]
    C --> D[Data Preparation]
    D --> E[Data Analysis]
    D --> F[Data Visualization]
    D --> G[Machine Learning]
```

This project can be useful for:

- 📊 Data analysis projects
- 🤖 Machine-learning dataset preparation
- 🎓 Student and academic projects
- 💼 Business data processing
- 📈 Dashboard data preparation
- 🔎 Dataset exploration
- 🧠 Learning data-preprocessing concepts

---

## 🔮 Future Improvements

- [ ] Missing-value detection
- [ ] Duplicate-row detection and removal
- [ ] Data-type detection
- [ ] Column filtering
- [ ] Data visualizations
- [ ] Outlier detection
- [ ] Download cleaned datasets
- [ ] AI-powered cleaning suggestions
- [ ] Dark and light mode

---

## 👨‍💻 Developer

<div align="center">

### Lakshay Tandon

**Web Developer | Data Science & AI Enthusiast**

[GitHub Profile](https://github.com/LakshayTandon02)

</div>

---

<div align="center">

## 🧹 Clean Data • Better Insights • Smarter Decisions

Made with ❤️ by **Lakshay Tandon**

</div>
