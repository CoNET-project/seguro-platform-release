#!/bin/bash

# =============================================================
# == 動態 Inno Setup 安裝包構建腳本
# =============================================================

# 接收傳入的第一個和第二個參數
CHANNEL_PARTNERS_ARG=$1
REFERRALS_ARG=$2

# 檢查參數是否存在
if [ -z "$CHANNEL_PARTNERS_ARG" ] || [ -z "$REFERRALS_ARG" ]; then
    echo "錯誤：請提供 ChannelPartners 和 Referrals 兩個參數。"
    echo "用法: ./build_installer.sh <ChannelPartners_Value> <Referrals_Value>"
    exit 1
fi

echo "--- 開始構建安裝包 ---"
echo "ChannelPartners: $CHANNEL_PARTNERS_ARG"
echo "Referrals: $REFERRALS_ARG"

# ====================================================================================
# == 這是最關鍵的一行 ==
# 下面的 docker run 命令，會在 amake/innosetup 後面緊跟著 Inno Setup 編譯器的參數。
# 我們使用 /d<變數名>="<值>" 的格式，將 shell 變數傳遞給 Inno Setup 的預處理器。
# ====================================================================================
docker run --rm \
    -v "$(pwd):/work" \
    -w /work \
    amake/innosetup \
    /dChannelPartnersVar="$CHANNEL_PARTNERS_ARG" \
    /dReferralsVar="$REFERRALS_ARG" \
    CreateSilentPassVPNInstaller.iss

# 檢查 Docker 命令是否成功執行
if [ $? -eq 0 ]; then
    echo "--- 構建成功！---"
    echo "安裝包位於：$(pwd)/Output/"
else
    echo "--- 構建失敗。---"
fi