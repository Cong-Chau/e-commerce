import prisma from "../config/prisma";
import { RoleName } from "@prisma/client";

export class UserService {
  async getAllUser(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const where = {
      userRoles: {
        none: {
          role: { is: { name: RoleName.ADMIN } },
        },
      },
    };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
        include: {
          userRoles: { include: { role: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const items = users.map(({ userRoles, ...u }) => ({
      ...u,
      roles: userRoles.map((ur) => ur.role.name),
    }));

    return { items, total };
  }
}
