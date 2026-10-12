![Main menu](./assets/f2g-cap-1.png)

# F2GO Assistant 🤖

**English | Español**

## 🇺🇸 English

**F2GO Assistant** is a desktop application built with Electron and Angular to automate hotel front desk workflows in **Front2Go PMS**, a Property Management System used to manage guest information, reservations, payments, and invoices.

The application interacts with Front2Go through API endpoints and web scraping to retrieve, process, and validate reservation and payment data. It automates repetitive operational tasks, streamlines financial audits, and helps identify discrepancies that would otherwise require extensive manual review.

### Features

- **Reservation Payment Auditing:** Reviews reservation payment statuses to identify missing payments, outstanding balances, and potential financial discrepancies.
- **Ledger & Payment Flow Analysis:** Examines reservation ledgers and payment records to verify charges, balances, and payment statuses.
- **PDF Text Extraction & Processing:** Extracts text from PDF documents and processes it using regular expressions (RegEx) to identify and structure relevant information.
- **Booking Coupon Processing:** Extracts and classifies booking coupon data, then compares it against reservation records to detect inconsistencies.
- **Automated Invoicing:** Uses reservation and payment data to streamline invoice generation, with support for manual invoicing workflows.
- **Audit Report Generation & Printing:** Generates audit reports and automates their printing.
- **Rate Discrepancy Detection:** Identifies potential pricing errors and inconsistencies in reservation rates.
- **Payment Discrepancy Detection:** Detects potential payment errors and mismatches between reservation, coupon, and payment records.

### Requirements

- Node.js and npm.
- Angular CLI and Electron, as required by the project setup.
- An active Front2Go account with the necessary system access.
- Project dependencies listed in `package.json`.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/subl-1me/f2go-assistant-prod
   cd f2go-assistant-prod
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the application:

   ```bash
   npm run electron
   ```

### Notes

- Developed from the perspective of a hotel front desk employee who uses Front2Go as the primary reservation management system.
- Access to Front2Go and its relevant endpoints is required for the application to operate correctly.
- Automates workflows through API requests, web scraping, document processing, and rule-based data validation.

---

## 🇲🇽 Español

**F2GO Assistant** es una aplicación de escritorio desarrollada con Electron y Angular para automatizar los procesos operativos de recepción hotelera en **Front2Go PMS**, un sistema de gestión hotelera utilizado para administrar información de huéspedes, reservaciones, pagos y facturación.

La aplicación interactúa con Front2Go mediante endpoints de API y técnicas de web scraping para obtener, procesar y validar información de reservaciones y pagos. Automatiza tareas operativas repetitivas, agiliza las auditorías financieras y facilita la detección de discrepancias que, de otro modo, requerirían una revisión manual considerable.

### Funcionalidades

- **Auditoría de pagos de reservaciones:** Revisa el estado de los pagos para identificar pagos faltantes, saldos pendientes y posibles discrepancias financieras.
- **Análisis de folios y flujos de pago:** Examina los folios de las reservaciones y los registros de pago para verificar cargos, saldos y estados de pago.
- **Extracción y procesamiento de texto en PDF:** Extrae texto de documentos PDF y lo procesa mediante expresiones regulares (RegEx) para identificar y estructurar información relevante.
- **Procesamiento de cupones de reservación:** Extrae y clasifica información de cupones de reservación y la compara con los registros del sistema para detectar inconsistencias.
- **Automatización de facturación:** Utiliza información de reservaciones y pagos para agilizar la generación de facturas, con soporte para procesos de facturación manual.
- **Generación e impresión de reportes de auditoría:** Genera reportes de auditoría y automatiza su impresión.
- **Detección de discrepancias en tarifas:** Identifica posibles errores e inconsistencias en las tarifas de las reservaciones.
- **Detección de discrepancias en pagos:** Detecta posibles errores de pago y diferencias entre los registros de reservaciones, cupones y pagos.

### Requisitos

- Node.js y npm.
- Angular CLI y Electron, según la configuración del proyecto.
- Una cuenta activa de Front2Go con los permisos de acceso necesarios.
- Las dependencias del proyecto especificadas en `package.json`.

### Instalación

1. Clona el repositorio:

   ```bash
   git clone https://github.com/subl-1me/f2go-assistant-prod
   cd f2go-assitant-prod
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Ejecuta la aplicación:

   ```bash
   npm run electron
   ```

### Notas

- Desarrollada desde la perspectiva de un empleado de recepción hotelera que utiliza Front2Go como sistema principal de gestión de reservaciones.
- Se requiere acceso a Front2Go y a los endpoints correspondientes para que la aplicación funcione correctamente.
- Automatiza procesos mediante solicitudes a API, web scraping, procesamiento de documentos y validación de datos basada en reglas.

---

**Technologies / Tecnologías:** Electron · Angular · TypeScript · Node.js · REST APIs · Web Scraping · PDF Processing · RegEx · Rule-Based Validation
