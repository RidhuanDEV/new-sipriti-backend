export interface SearchAnggotaResultDto {
  nama: string;
  noIdentitas: string;
  programStudiKode: string;
  programStudiNama: string;
  institusi: string;
  tipeAnggota: "Dosen" | "Mahasiswa";
}
