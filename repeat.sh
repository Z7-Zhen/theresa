#!/bin/bash

# Script untuk pull, commit, dan push ke main branch tanpa node_modules dan package-lock.json

# Pastikan ada file .gitignore
if [ ! -f ".gitignore" ]; then
    echo "📝 Membuat .gitignore..."
    echo -e "node_modules/\npackage-lock.json" > .gitignore
else
    # Tambahkan node_modules dan package-lock.json ke .gitignore jika belum ada
    grep -qxF "node_modules/" .gitignore || echo "node_modules/" >> .gitignore
    grep -qxF "package-lock.json" .gitignore || echo "package-lock.json" >> .gitignore
fi

# Hapus node_modules dan package-lock.json dari staging jika sudah terlanjur ditrack
git rm -r --cached node_modules 2>/dev/null
git rm --cached package-lock.json 2>/dev/null

# Pull perubahan dari remote (mengizinkan histories yang tidak terkait)
git pull origin main --allow-unrelated-histories
if [ $? -ne 0 ]; then
    echo "⚠️ Gagal melakukan git pull!"
    exit 1
fi

# Tambahkan semua perubahan (kecuali yang di-ignore)
git add .
if [ $? -ne 0 ]; then
    echo "⚠️ Gagal melakukan git add!"
    exit 1
fi

# Commit perubahan
git commit -m "update: push terbaru tanpa node_modules & package-lock.json"
if [ $? -ne 0 ]; then
    echo "⚠️ Gagal melakukan git commit! (Mungkin tidak ada perubahan untuk di-commit)"
fi

# Push ke main branch
git push origin main
if [ $? -ne 0 ]; then
    echo "⚠️ Gagal melakukan git push!"
    exit 1
fi

echo "✅ Selesai: Perubahan berhasil di-push ke main branch (tanpa node_modules & package-lock.json)."

