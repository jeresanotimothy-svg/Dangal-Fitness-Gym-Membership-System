# Dangal Fitness System (CCS110 Finals)
Gym / Fitness Center Membership & Attendance System

Stack: HTML + Bootstrap 5 (frontend) - Node.js + Express (backend) - MySQL (database)

## Run with XAMPP
1. Install Node.js (LTS).
2. Open the XAMPP Control Panel and start MySQL (and Apache for phpMyAdmin).
3. Open http://localhost/phpmyadmin, go to the Import tab, and import `database/gym_db.sql`
   (this recreates the database, so import it again after every update of this file).
4. Copy `.env.example` to `.env`. Set `DB_PASSWORD` to your MySQL password (the server will not start without it) and
   replace `SESSION_SECRET` with your own long random text (the file shows a command that makes one).
   See **Set a MySQL password** below if MySQL still has no password.
5. In this folder run:  `npm install`  then  `npm start`
6. Open http://localhost:3000

Sample logins (change them before going online): admin/admin123 (Admin) - manager/manager123 (Admin) - staff/staff123 - frontdesk/front123 - cashier/cash123 (Staff)

## Security: how the system protects data (basic level)
| Protection | How it works |
|---|---|
| Login required | Every page of data is behind a login; without a valid session the server answers 401. |
| Hashed passwords | Passwords are never stored as text. They are saved as salted `scrypt` hashes (`utils/password.js`), so even the database owner cannot read them. |
| Password rules | 6 to 50 characters, no spaces. An Admin can reset a forgotten password on the User Accounts page. |
| Brute-force protection | After 5 wrong passwords (same username, same computer) login is blocked for the rest of 15 minutes; 20 wrong tries from one computer also blocks it. |
| Role-based access | Admin and Staff permissions are checked on the server, not only hidden on the screen (for example Staff cannot call the Trainers, Classes, Plans or Users data, edit, hide or see revenue). |
| Disabled accounts | A disabled user is logged out on their next click and cannot log in again. Accounts are never deleted. |
| Safe sessions | The login cookie is signed, HttpOnly (page scripts cannot read it), SameSite, HTTPS-only when online, and ends after 60 minutes without activity. |
| SQL injection | Every query uses placeholders (`?`); table and column names come only from the code, and sort fields come from a fixed list. |
| Input validation | The same rules run in the browser and on the server (`public/js/validators.js`). Output shown on pages is escaped (XSS). |
| Cross-site requests | Requests that change data must come from this same site and must be JSON (`middleware/sameOrigin.js`). |
| Browser protection headers | `X-Frame-Options`, `X-Content-Type-Options`, `Content-Security-Policy` and others (`middleware/securityHeaders.js`); data responses are never cached. |
| No data loss | Nothing is deleted: records are hidden, accounts are disabled. |
| Database login | MySQL needs a password. The server reads it from `.env` (`config/db.js`) and refuses to start without it. |
| Secrets stay secret | Database password and session secret live in `.env`, which is listed in `.gitignore`. |

Still to do before going online with real data: use HTTPS (the host provides it), set `NODE_ENV=production`,
change every sample password, and keep regular database backups.

## Deploy online (Render + TiDB Cloud, both free)
Render runs the Node app. It has no MySQL, so the database goes on **TiDB Cloud** (free, MySQL compatible, works from other servers).
InfinityFree cannot be used for the database: its free MySQL only accepts connections from its own PHP hosting.

1. **Database.** Create a free TiDB Cloud account and cluster. Open **SQL Editor**, paste all of `database/gym_db_cloud.sql` and run it
   (it creates `gym_db` with all tables and sample data). Click **Connect** and note the host, port (4000), user and password.
2. **GitHub.** Push this project (the `.env` file stays private because of `.gitignore`).
3. **Render.** New > Web Service > pick the repository. Build command `npm install`, start command `npm start`, instance type Free,
   health check path `/healthz`. (Or use New > Blueprint, which reads `render.yaml`.)
4. **Environment tab** (these replace `.env` online):

| Name | Value |
|---|---|
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | long random text (16+ characters); the Blueprint makes one for you |
| `DB_HOST` | TiDB host, for example `gateway01.xxxx.prod.aws.tidbcloud.com` |
| `DB_PORT` | `4000` |
| `DB_USER` | the TiDB user, for example `xxxxxxxx.root` |
| `DB_PASSWORD` | the TiDB password |
| `DB_NAME` | `gym_db` |
| `DB_SSL` | `true` |
| `DB_TIMEZONE` | `+08:00` |

5. Deploy, open the Render address, log in as `admin` and **reset the sample passwords** (User Accounts > Password).

Free Render services go to sleep when nobody visits, so the first page after a pause can take about a minute to load.

## Set a MySQL password
XAMPP's MySQL starts with a blank `root` password. Give it one, then write the same password in `.env` (`DB_PASSWORD`).
1. XAMPP Control Panel > MySQL **Shell** (or phpMyAdmin > SQL tab) and run, with your own password:
   ```sql
   ALTER USER IF EXISTS 'root'@'localhost' IDENTIFIED BY 'your-password';
   ALTER USER IF EXISTS 'root'@'127.0.0.1' IDENTIFIED BY 'your-password';
   ALTER USER IF EXISTS 'root'@'::1' IDENTIFIED BY 'your-password';
   FLUSH PRIVILEGES;
   ```
2. phpMyAdmin: open `C:\xampp\phpMyAdmin\config.inc.php` and set `$cfg['Servers'][$i]['password'] = 'your-password';`
3. Put the same password in `.env`. The password is never written in the code or on GitHub.

## Look and feel
Calm forest-green theme with **Light mode** and **Dark mode**. Use the mode button in the top bar (on the login page, the button in the top-right corner). The choice is remembered in the browser; the first visit follows the computer's own light/dark setting. Colors are checked for readable contrast in both modes, and icons come from Bootstrap Icons.

## Sort menu (Members and Attendance log)
Pop-up messages (top-right) appear after a change and disappear by themselves.

Click **Sort**, pick what to sort by Text fields sort alphabetically (**A to Z / Z to A**), date fields by oldest or newest first.
(Members: First name, Last name, Email, Plan, Status, Date joined, Newest added; Attendance: Member name,
Check-in time, Check-out time), then choose **Ascending** or **Descending**. The check marks show the current choice.
The server only accepts the listed sort fields, so nothing else can be injected into the query.

## Who can do what
| Page | Admin | Staff |
|---|---|---|
| Dashboard | view | view |
| Members | add, edit, status dropdown, hide | view, add |
| Attendance | check in / out buttons, hide log rows | check in / out buttons |
| Payments | add, edit, hide | view, add |
| Class Bookings | add, change status, hide | view, add |
| Plans, Trainers, Classes | everything | no access |
| User Accounts | add, disable / enable | no access |

Nothing is ever deleted. "Hide" sets `is_hidden = 1` (Admin can tick **Show hidden** and **Unhide**),
and user accounts are disabled (`is_active = 0`) instead of deleted.

## Rules checked on every input (browser and server use the same file: `public/js/validators.js`)
- Names: letters only (spaces, apostrophes, hyphens and periods allowed).
- Mobile number: 09XXXXXXXXX. Email must be valid. Username: letters, numbers, underscore.
- Join date and payment date are set to today automatically (cannot be typed, so never past or future).
- Class booking date: today up to 30 days ahead, only on a day the class runs, only if the class is not full,
  and only for Active members.
- Attendance has no typing: the Check In / Check Out buttons record the time. Only Active members can check in,
  and nobody can check in twice.
- GCash and Card payments need a reference number (the receipt); Cash payments have none.
  The amount is filled in from the plan price.

## Folder structure
```
dangal-fitness-system/
├── server.js                  Express app entry point
├── package.json
├── render.yaml               Render blueprint (optional)
├── .env / .env.example        DB settings, port, session secret
├── .gitignore
├── config/
│   └── db.js                  MySQL connection pool
├── middleware/
│   ├── auth.js                requireLogin (also blocks disabled users), requireAdmin
│   ├── loginLimiter.js        blocks password guessing
│   ├── securityHeaders.js     browser protection headers
│   ├── sameOrigin.js          blocks requests from other websites
│   └── errorHandler.js
├── utils/
│   └── password.js            scrypt password hashing
├── controllers/               the logic (talks to MySQL)
│   ├── crudController.js      shared list / create / update / status / hide
│   ├── authController.js      dashboardController.js   lookupController.js
│   ├── memberController.js    planController.js        trainerController.js
│   ├── classController.js     paymentController.js     enrollmentController.js (class bookings)
│   ├── attendanceController.js  (check in / check out)
│   └── userController.js      (disable / enable)
├── routes/                    URL -> controller (+ who may use it)
├── public/                    frontend (served by Express)
│   ├── login.html  index.html  manage.html
│   ├── css/theme.css          green theme (light + dark colours)
│   └── js/theme.js  validators.js  common.js  config.js  manage.js
│       manage/ (state.js  table.js  sort.js  board.js  form.js)
└── database/
    ├── gym_db.sql             local XAMPP (recreates the database)
    ├── gym_db_cloud.sql       online database (TiDB Cloud)
    └── queries.sql
```

## Tables (8, with 7 foreign keys)
users, membership_plans, trainers, members, classes, payments, attendance, class_enrollments (junction / bookings)
