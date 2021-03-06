#!/usr/bin/env bash
mkdir "ktv_output" || return

function hlsConvert() {
    ffmpeg -i  "$1" \
    -filter_complex \
    "[0:v]split=3[v0][v1][v2]; \
    [v0]scale=w=854:h=480[v1out]; [v1]scale=w=640:h=360[v2out]; [v2]scale=w=256:h=144[v3out]" \
    -map [v1out] -c:v:1 libx264 -x264-params "nal-hrd=cbr:force-cfr=1" -b:v:1 4M -maxrate:v:1 4M -minrate:v:1 3M -bufsize:v:1 3M -preset fast -g 48 -sc_threshold 0 -keyint_min 48 \
    -map [v2out] -c:v:2 libx264 -x264-params "nal-hrd=cbr:force-cfr=1" -b:v:2 1M -maxrate:v:2 1M -minrate:v:2 1M -bufsize:v:2 1M -preset fast -g 48 -sc_threshold 0 -keyint_min 48 \
    -map [v3out] -c:v:3 libx264 -x264-params "nal-hrd=cbr:force-cfr=1" -b:v:3 0.3M -maxrate:v:3 0.3M -minrate:v:3 0.3M -bufsize:v:3 0.5M -preset fast -g 48 -sc_threshold 0 -keyint_min 48 \
    -map a:0 -c:a:1 aac -b:a:1 96k -ac 2 \
    -map a:0 -c:a:2 aac -b:a:2 64k -ac 2 \
    -map a:0 -c:a:3 aac -b:a:3 38k -ac 2 \
    -f hls \
    -hls_time 2 \
    -hls_playlist_type vod \
    -hls_flags independent_segments \
    -hls_segment_type mpegts \
    -hls_segment_filename ktv_output/"$2"/stream_%v_data%02d.ts \
    -master_pl_name master.m3u8 \
    -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" ktv_output/"$2"/stream_%v.m3u8
}

re='^[0-9]+$'

if [[ "$2" =~ $re ]]
then
  for ((i=1; i<=$2; i++))
   do
     mkdir "ktv_output/$i" || return
     hlsConvert "$1"/"$i".* "$i"
  done
else
  hlsConvert "$1" "."
fi
