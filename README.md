<div align="center">

# 🧹 Data Cleaning Studio

### Transform Raw Data into Clean, Analysis-Ready Insights

<p>
  A modern web application for uploading, exploring, cleaning, and preparing
  CSV and Excel datasets through a simple and interactive interface.
</p>

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![CSV](https://img.shields.io/badge/CSV-Supported-2EA44F?style=for-the-badge)
![Excel](https://img.shields.io/badge/Excel-Supported-217346?style=for-the-badge&logo=microsoft-excel&logoColor=white)

<br />

[🚀 Getting Started](#-getting-started)
&nbsp;&nbsp;•&nbsp;&nbsp;
[✨ Features](#-key-features)
&nbsp;&nbsp;•&nbsp;&nbsp;
[🔄 Workflow](#-application-workflow)
&nbsp;&nbsp;•&nbsp;&nbsp;
[🛠️ Tech Stack](#️-technology-stack)

</div>

---

## 📌 About the Project

**Data Cleaning Studio** is a modern and user-friendly web application designed to simplify the process of preparing raw datasets for analysis.

Users can upload **CSV and Excel files**, preview their data, inspect the dataset structure, identify potential data-quality issues, and perform cleaning operations through an intuitive interface.

The project focuses on making data preparation more accessible for:

- 📊 Data Analysts
- 🤖 Data Science Students
- 🧠 Machine Learning Enthusiasts
- 💼 Business Professionals
- 🎓 Academic Projects

> **Goal:** Make raw data easier to understand, clean, and prepare before analysis or machine-learning workflows.

---

# 🔄 Application Workflow

```mermaid
flowchart LR

    A([👤 User Opens Application])
        --> B[📁 Upload Dataset]

    B --> C{📄 File Format}

    C -->|CSV| D[🔍 Parse CSV Data]
    C -->|Excel XLSX/XLS| E[📗 Parse Excel Data]

    D --> F[📊 Generate Dataset Preview]
    E --> F

    F --> G[🔎 Inspect Rows and Columns]

    G --> H[🧹 Select Data Cleaning Actions]

    H --> I[⚙️ Process and Clean Dataset]

    I --> J[✅ Generate Cleaned Data]

    J --> K[📈 Review Final Results]

    K --> L([🎉 Data Ready for Analysis])
    How the workflow works
Upload — The user selects a CSV or Excel dataset.
File Validation — The application checks whether the selected file format is supported.
Data Parsing — The file is processed and converted into usable tabular data.
Dataset Preview — Rows, columns, and dataset information are displayed.
Data Inspection — The user can explore the dataset and identify issues.
Cleaning Process — Selected cleaning operations are applied to the data.
Final Review — The cleaned dataset is reviewed and prepared for further analysis.
✨ Key Features
<table> <tr> <td width="50%">
📁 Dataset Upload

Upload and process common dataset formats:

CSV files
Excel .xlsx files
Excel .xls files
</td> <td width="50%">
👀 Data Preview

View your dataset in an organized interface:

Column headers
Dataset rows
Structured table preview
Quick data inspection
</td> </tr> <tr> <td width="50%">
🧹 Data Cleaning

Prepare datasets by identifying and handling common data-quality problems.

The interface is designed to make data-cleaning operations easier to understand and use.

</td> <td width="50%">
📊 Dataset Insights

Explore important information about uploaded data:

Number of rows
Number of columns
Dataset structure
Available fields
</td> </tr> <tr> <td width="50%">
⚡ Fast Performance

Built with Vite for:

Fast development
Quick application startup
Optimized production builds
</td> <td width="50%">
📱 Responsive Interface

The application is designed to provide a smooth experience across:

Desktop computers
Tablets
Mobile devices
</td> </tr> </table>
flowchart TD

    U[👤 User]

    U --> UI[🖥️ React User Interface]

    UI --> DS[📁 Dataset Selector]

    DS --> P{File Parser}

    P -->|CSV| CP[📄 CSV Parser]
    P -->|Excel| EP[📗 Excel Parser]

    CP --> DATA[(Dataset Data)]
    EP --> DATA

    DATA --> PREVIEW[📊 Data Preview]

    PREVIEW --> CLEAN[🧹 Cleaning Engine]

    CLEAN --> RESULT[(Cleaned Dataset)]

    RESULT --> OUTPUT[✅ Final Dataset View]
