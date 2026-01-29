import { db, runMigrations } from "../db";
import { auth } from "../auth";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@admin.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin User";

async function seedAdmin() {
  console.log("Running migrations...");
  runMigrations();

  console.log("Checking for existing admin user...");

  // Check if admin user already exists
  const existing = db
    .query<{ id: string }, [string]>(
      `SELECT id FROM "user" WHERE email = ?`
    )
    .get(ADMIN_EMAIL);

  if (existing) {
    console.log(`Admin user already exists: ${ADMIN_EMAIL}`);
    console.log("Ensuring admin role is set...");
    db.run(`UPDATE "user" SET role = 'admin' WHERE email = ?`, [ADMIN_EMAIL]);
    console.log("Done!");
    return;
  }

  console.log(`Creating admin user: ${ADMIN_EMAIL}`);

  try {
    // Use better-auth's signUpEmail to create user with proper password hashing
    const result = await auth.api.signUpEmail({
      body: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: ADMIN_NAME,
      },
    });

    if (!result.user) {
      throw new Error("Failed to create user");
    }

    console.log(`User created with ID: ${result.user.id}`);

    // Update role to admin
    db.run(`UPDATE "user" SET role = 'admin' WHERE id = ?`, [result.user.id]);
    console.log("Role set to admin");
    console.log("");
    console.log("Admin user created successfully!");
    console.log(`  Email: ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log("");
    console.log("You can now log in with these credentials.");
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

seedAdmin();
