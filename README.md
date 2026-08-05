<div align="center">

# 🧹 Data Cleaning Studio

### Transform Raw Data into Clean, Analysis-Ready Insights

<p>
A modern and interactive web application designed to upload, explore, clean, and prepare datasets for analysis.
</p>

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Data Cleaning](https://img.shields.io/badge/Data-Cleaning-success?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)

<br>

[🚀 Getting Started](#-getting-started) •
[✨ Features](#-key-features) •
[🔄 Workflow](#-application-workflow) •
[🛠️ Tech Stack](#️-technology-stack) •
[👨‍💻 Developer](#-developer)

</div>

---

# 📌 About the Project

**Data Cleaning Studio** is a modern and user-friendly web application designed to simplify the process of working with raw datasets.

The application provides an interactive interface where users can upload, explore, inspect, and prepare datasets for analysis. It helps users understand their data and improve its quality before using it for data analysis, visualization, or machine-learning workflows.

> 🎯 **Goal:** Make raw data easier to explore, understand, clean, and prepare for better insights.

---

# 🔄 Application Workflow

```mermaid
flowchart LR

    A([👤 User Opens App])
    B[📁 Upload Dataset]
    C{📄 Check File Type}
    D[🔍 Process CSV Data]
    E[📗 Process Excel Data]
    F[📊 Generate Data Preview]
    G[🔎 Inspect Rows & Columns]
    H[🧹 Select Cleaning Options]
    I[⚙️ Process Dataset]
    J[✅ Generate Clean Data]
    K[📈 Review Results]
    L([🎉 Ready for Analysis])

    A --> B
    B --> C

    C -->|CSV| D
    C -->|Excel| E

    D --> F
    E --> F

    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
    K --> L
