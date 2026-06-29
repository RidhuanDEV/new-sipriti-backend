import { Op } from "sequelize";
import { User } from "../user/user.model.js";
import { Role } from "../roles/role.model.js";
import { UserRole } from "../roles/user-role.model.js";
import { Prodi } from "../prodi/prodi.model.js";
import { Mahasiswa } from "../proposal/mahasiswa.model.js";
import { MemberProposal } from "../proposal/member-proposal.model.js";
import type { InferAttributes, Transaction, WhereOptions } from "sequelize";

interface RoleInclude {
  model: typeof Role;
  as: "role";
  attributes: string[];
  required?: boolean;
  where?: { name: string };
}

const AUTH_USER_RELATION_INCLUDES = [
  { model: Role, as: "role", attributes: ["id", "name"], required: false },
  {
    model: Role,
    as: "roles",
    attributes: ["id", "name"],
    through: { attributes: [] },
    required: false,
  },
  {
    model: Prodi,
    as: "prodiRelation",
    attributes: ["id", "kodeProdi", "namaProdi", "jenjang"],
    required: false,
  },
];

export class AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    return User.unscoped().findOne({
      where: { email },
      paranoid: false,
      include: AUTH_USER_RELATION_INCLUDES,
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return User.unscoped().findOne({
      where: { username },
      paranoid: false,
      include: AUTH_USER_RELATION_INCLUDES,
    });
  }

  async findById(id: string, paranoid = true, trx?: Transaction): Promise<User | null> {
    return User.findByPk(id, {
      paranoid,
      ...(trx ? { transaction: trx } : {}),
      include: AUTH_USER_RELATION_INCLUDES,
    });
  }

  async searchLecturers(
    query: string,
    excludeUserId: string,
  ): Promise<User[]> {
    const where = {
      ...(query.length > 0
        ? {
            [Op.or]: [
              { name: { [Op.like]: `%${query}%` } },
              { nidn: { [Op.like]: `%${query}%` } },
            ],
          }
        : {}),
      ...(excludeUserId.length > 0 ? { id: { [Op.ne]: excludeUserId } } : {}),
    };

    return User.findAll({
      where,
      attributes: ["name", "nidn"],
      include: [
        {
          model: Prodi,
          as: "prodiRelation",
          attributes: ["kodeProdi", "namaProdi"],
          required: false,
        },
      ],
      order: [["name", "ASC"]],
      limit: 10,
    });
  }

  async searchStudents(query: string): Promise<Mahasiswa[]> {
    const where =
      query.length > 0
        ? {
            [Op.or]: [
              { nama: { [Op.like]: `%${query}%` } },
              { nrp: { [Op.like]: `%${query}%` } },
            ],
          }
        : {};

    return Mahasiswa.findAll({
      where,
      attributes: ["nama", "nrp"],
      include: [
        {
          model: Prodi,
          as: "prodiRelasi",
          attributes: ["kodeProdi", "namaProdi"],
          required: false,
        },
      ],
      order: [["nama", "ASC"]],
      limit: 10,
    });
  }

  async findAndCountUsers(query: {
    page: number;
    limit: number;
    search: string;
    role: string;
    status: "all" | "active" | "inactive";
    includeStatusFilters: boolean;
  }): Promise<{ rows: User[]; count: number }> {
    const searchWhere =
      query.search.length > 0
        ? {
            [Op.or]: [
              { name: { [Op.like]: `%${query.search}%` } },
              { nidn: { [Op.like]: `%${query.search}%` } },
              { email: { [Op.like]: `%${query.search}%` } },
              { username: { [Op.like]: `%${query.search}%` } },
            ],
          }
        : {};
    const statusWhere =
      query.status === "active"
        ? { deletedAt: null }
        : query.status === "inactive"
          ? { deletedAt: { [Op.not]: null } }
          : {};
    const where = { ...searchWhere, ...statusWhere };

    const roleInclude: RoleInclude = {
      model: Role,
      as: "role",
      attributes: ["id", "name"],
    };
    if (query.role.length > 0) {
      roleInclude.where = { name: query.role };
    }

    return User.findAndCountAll({
      where,
      include: [
        roleInclude,
        {
          model: Role,
          as: "roles",
          attributes: ["id", "name"],
          through: { attributes: [] },
          required: false,
        },
        {
          model: Prodi,
          as: "prodiRelation",
          attributes: ["id", "kodeProdi", "namaProdi", "jenjang"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
      paranoid: !query.includeStatusFilters,
    });
  }

  async usernameExists(username: string, excludeUserId?: string): Promise<boolean> {
    const where: WhereOptions<User> =
      excludeUserId === undefined
        ? { username }
        : { username, id: { [Op.ne]: excludeUserId } };
    const count = await User.count({ where, paranoid: false });
    return count > 0;
  }

  async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
    const where: WhereOptions<User> =
      excludeUserId === undefined
        ? { email }
        : { email, id: { [Op.ne]: excludeUserId } };
    const count = await User.count({ where, paranoid: false });
    return count > 0;
  }

  async nidnExists(nidn: string, excludeUserId?: string): Promise<boolean> {
    const where: WhereOptions<User> =
      excludeUserId === undefined
        ? { nidn }
        : { nidn, id: { [Op.ne]: excludeUserId } };
    const count = await User.count({ where, paranoid: false });
    return count > 0;
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return Role.findOne({ where: { name } });
  }

  async findRolesByIds(roleIds: string[]): Promise<Role[]> {
    return Role.findAll({ where: { id: { [Op.in]: roleIds } } });
  }

  async findProdiByKode(kodeProdi: string): Promise<Prodi | null> {
    return Prodi.findOne({ where: { kodeProdi } });
  }

  async createUser(
    data: {
      email: string | null;
      password: string;
      roleId: string;
      name?: string | null;
      username?: string | null;
      nidn?: string | null;
      institusi?: string | null;
      prodiKode?: string | null;
    },
    trx?: Transaction,
  ): Promise<User> {
    return User.create(data, trx ? { transaction: trx } : undefined);
  }

  async updateUser(
    user: User,
    fields: Partial<InferAttributes<User>>,
    trx?: Transaction,
  ): Promise<User> {
    return user.update(fields, trx ? { transaction: trx } : undefined);
  }

  async syncUserRoles(
    userId: string,
    roleIds: string[],
    assignedBy: string | null,
    trx?: Transaction,
  ): Promise<void> {
    const options = trx ? { transaction: trx } : undefined;
    await UserRole.destroy({ where: { userId }, ...options });

    if (roleIds.length === 0) {
      return;
    }

    await UserRole.bulkCreate(
      roleIds.map((roleId) => ({
        userId,
        roleId,
        assignedBy,
        assignedAt: new Date(),
      })),
      {
        ignoreDuplicates: true,
        ...(trx ? { transaction: trx } : {}),
      },
    );
  }

  async softDeleteUser(user: User, trx?: Transaction): Promise<void> {
    await user.destroy(trx ? { transaction: trx } : undefined);
  }

  async restoreUser(user: User, trx?: Transaction): Promise<void> {
    await user.restore(trx ? { transaction: trx } : undefined);
  }

  async cascadeIdentity(
    oldIdentity: string,
    newIdentity: string,
    trx?: Transaction,
  ): Promise<void> {
    const options = trx ? { transaction: trx } : undefined;
    await MemberProposal.update(
      { no_identitas: newIdentity },
      { where: { no_identitas: oldIdentity }, ...options },
    );
    await Mahasiswa.update(
      { nrp: newIdentity },
      { where: { nrp: oldIdentity }, ...options },
    );
  }
}
