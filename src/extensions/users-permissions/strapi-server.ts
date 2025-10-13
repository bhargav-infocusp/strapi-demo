export default (plugin: any) => {
  const defaultCallback = plugin.controllers.auth.callback;

  plugin.controllers.auth.callback = async (ctx: any) => {
    const provider = ctx.params.provider || "google";

    // For non-Google providers, run the normal logic
    if (provider !== "google") {
      return defaultCallback(ctx);
    }

    // Use providers service from users-permissions plugin
    const user = await strapi
      .plugin("users-permissions")
      .service("providers")
      .connect(provider, ctx.query);

    // Admin services
    const adminUserService = strapi.service("admin::user");
    const roleService = strapi.service("admin::role");
    const authService = strapi.service("admin::auth");

    // Fetch Author role
    const authorRole = await roleService.findOne({ where: { code: "author" } });
    if (!authorRole) {
      ctx.throw(400, "Author role not found in admin roles");
    }

    // Check if admin user already exists with this email
    let adminUser = await adminUserService.findOne({
      where: { email: user.email },
    });

    if (!adminUser) {
      // ✅ First-time Google user → create as Author
      adminUser = await adminUserService.create({
        email: user.email,
        firstname: user.username || user.email.split("@")[0],
        lastname: "",
        isActive: true,
        roles: [authorRole.id],
      });
    }

    // ✅ Returning Google user → keep existing roles, no overwrite

    // Log them into the Admin panel
    return await authService.login(adminUser);
  };

  return plugin;
};

