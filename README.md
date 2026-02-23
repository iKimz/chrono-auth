# ChronoAuth

ChronoAuth is a secure, locally-hosted Web Application capable of generating Time-based One-time Passwords (TOTP) akin to Authy and Google Authenticator.

Built with a Spring Boot backend, a modern Vite + React frontend, MariaDB for persistence, and OpenLDAP for robust authentication, ChronoAuth provides a centralized and self-hosted solution for managing your 2FA security codes.

---

## Features

- **Standard TOTP Code Generation**: Generates standard 6-digit codes dynamically every 30 seconds (HMAC-SHA1).
- **LDAP Authentication Engine**: Secure login powered by OpenLDAP (with a configurable `.env` bypass for local testing).
- **QR Code Scanning**: Easily add services by uploading a screenshot of an `otpauth://` QR Code.
- **Manual Setup**: Add services securely by pasting raw Base32 Secret Keys.
- **Copy to Clipboard**: Seamless 1-click OTP copying straight from the dashboard.
- **Auditing & Activity Logs**: Comprehensive timestamped history tracking when users log in and when specific OTPs are fetched.
- **Admin Dashboard**: Special `admin` role with complete visibility over all generated keys and global user activity logs.
- **Premium UI Aesthetic**: Beautiful Dark Mode, CSS animations, and frosted glass components (Glassmorphism).

---

## Architecture Stack

- **Frontend**: Vite, React 18, pure Vanilla CSS (`lucide-react` for icons, `jsqr` for Web QR parsing).
- **Backend**: Java 17, Spring Boot 3.3.0 (Spring Web, Spring Security, Spring Data JPA).
- **Database**: MariaDB 10.11
- **Directory Service**: OpenLDAP (`osixia/openldap`) with `phpLDAPadmin`.
- **Orchestration**: Docker Compose (Nginx for Vite, JRE for Spring, DB, and LDAP containers).

---

## Getting Started

Deploying ChronoAuth locally is incredibly straightforward as the entire stack is pre-configured via Docker Compose!

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Installation & Deployment

1. **Clone the Repository**
   ```bash
   git clone https://github.com/iKimz/chrono-auth.git
   cd chrono-auth
   ```

2. **Spin Up the Containers**
   Launch all 5 containers simultaneously (Frontend, Backend, Database, LDAP, phpLDAPadmin).
   ```bash
   docker compose up --build -d
   ```

3. **Access the Application**
   - **Frontend (ChronoAuth Web)**: [http://localhost](http://localhost)
   - **Backend API**: `http://localhost:8080/api/`
   - **phpLDAPadmin**: [http://localhost:6443](http://localhost:6443) (Login: `cn=admin,dc=chrono-auth,dc=local` / Password: `admin`)

### Default Test Users
The bootstrap LDIF automatically creates a test user for immediate try-outs!
- **Username**: `testuser`
- **Password**: `testpassword`

> **Note**: To completely test the "Admin" features, you can log in directly using the username `admin` and password `admin`. 

---

## Environment Variables (`docker-compose.yml`)

The backend behavior is governed by environment configurations defined in `docker-compose.yml`:

| Variable                       | Description                                      | Default Value                           |
|--------------------------------|--------------------------------------------------|-----------------------------------------|
| `AUTH_METHOD`                  | Toggles auth type (`ldap` or `bypass`). If `bypass`, any password grants access. | `bypass` (Dev default)                |
| `SPRING_LDAP_URLS`             | The URI connecting to OpenLDAP.                  | `ldap://ldap:389`                       |
| `SPRING_DATASOURCE_URL`        | JDBC connection string for MariaDB.              | `jdbc:mariadb://mariadb:3306/chrono_auth`|

---

## Security Note

ChronoAuth securely stores all Secret Keys inside the MariaDB database using **AES-256 Encryption at Rest**. 

The encryption key is automatically generated or can be explicitly passed in via the `CHRONO_ENCRYPTION_KEY` environment variable within your `docker-compose.yml` file, safeguarding secrets from being exposed as plaintext payloads.

---

## Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/iKimz/chrono-auth/issues) if you'd like to contribute.

## License

This project is open-source and available under the MIT License.
