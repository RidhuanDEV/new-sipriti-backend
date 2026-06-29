import { Op } from "sequelize";
import { Prodi } from "../prodi/prodi.model.js";
import { Mahasiswa } from "../proposal/mahasiswa.model.js";
import { User } from "../user/user.model.js";
import type { SearchAnggotaResultDto } from "./dto/search-anggota.dto.js";

export class SearchAnggotaService {
  async searchAnggota(keyword = ""): Promise<SearchAnggotaResultDto[]> {
    const searchTerm = keyword.trim();
    if (!searchTerm) return [];
    const prefixTerm = `${searchTerm}%`;

    const userResults = await User.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: prefixTerm } },
          { nidn: { [Op.like]: prefixTerm } },
        ],
      },
      attributes: ["id", "name", "nidn", "institusi", "prodiKode"],
      include: [
        {
          model: Prodi,
          as: "prodiRelation",
          attributes: ["id", "kodeProdi", "namaProdi"],
          required: false,
        },
      ],
      limit: 10,
    });

    const mahasiswaResults = await Mahasiswa.findAll({
      where: {
        [Op.or]: [
          { nrp: { [Op.like]: prefixTerm } },
          { nama: { [Op.like]: prefixTerm } },
        ],
      },
      include: [
        {
          model: Prodi,
          as: "prodiRelasi",
          attributes: ["id", "kodeProdi", "namaProdi"],
          required: false,
        },
        {
          model: User,
          as: "akun",
          attributes: ["id", "name"],
          required: false,
        },
      ],
      limit: 10,
    });

    const seenIdentitas = new Set(userResults.map((user) => String(user.nidn ?? "")).filter(Boolean));
    const results: SearchAnggotaResultDto[] = [
      ...userResults.map((user) => ({
        nama: user.name ?? "",
        noIdentitas: user.nidn ?? "",
        programStudiKode: user.prodiRelation?.kodeProdi ?? "",
        programStudiNama: user.prodiRelation?.namaProdi ?? "",
        institusi: user.institusi ?? "",
        tipeAnggota: "Dosen" as const,
      })),
      ...mahasiswaResults
        .filter((mahasiswa) => !mahasiswa.akun && !seenIdentitas.has(String(mahasiswa.nrp)))
        .map((mahasiswa) => ({
          nama: mahasiswa.nama,
          noIdentitas: mahasiswa.nrp,
          programStudiKode: mahasiswa.prodiRelasi?.kodeProdi ?? "",
          programStudiNama: mahasiswa.prodiRelasi?.namaProdi ?? "",
          institusi: "",
          tipeAnggota: "Mahasiswa" as const,
        })),
    ];

    return results.slice(0, 5);
  }
}

export const searchAnggotaService = new SearchAnggotaService();
