#!/bin/bash

# Script untuk pull, commit, dan push ke main branch

# Pull perubahan dari remote, mengizinkan histories yang tidak terkait
git pull origin main --allow-unrelated-histories
if [ $? -ne 0 ]; then
    echo "⚠️ Gagal melakukan git pull!"
    exit 1
fi

# Tambahkan semua perubahan
git add .
if [ $? -ne 0 ]; then
    echo "⚠️ Gagal melakukan git add!"
    exit 1
fi

# Commit perubahan
git commit -m "merge remote changes"
if [ $? -ne 0 ]; then
    echo "⚠️ Gagal melakukan git commit! Mungkin tidak ada perubahan untuk di-commit."
fi

# Push ke main branch
git push origin main
if [ $? -ne 0 ]; then
    echo "⚠️ Gagal melakukan git push!"
    exit 1
fi

echo "✅ Selesai: Perubahan berhasil di-push ke main branch."
