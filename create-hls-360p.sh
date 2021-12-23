#!/usr/bin/env bash
mkdir "ktv_output" || return

function hlsConvert() {
    ffmpeg -i  "$1" \
    -filter_complex \
    "[0:v]split=2[v0][v1]; \
    [v0]scale=w=640:h=360[v1out]; [v1]scale=w=256:h=144[v2out]" \
    -map [v1out] -c:v:0 libx264 -x264-params "nal-hrd=cbr:force-cfr=1" -b:v:0 1M -maxrate:v:0 1M -minrate:v:0 1M -bufsize:v:0 1M -preset fast -g 48 -sc_threshold 0 -keyint_min 48 \
    -map [v2out] -c:v:1 libx264 -x264-params "nal-hrd=cbr:force-cfr=1" -b:v:1 0.3M -maxrate:v:1 0.3M -minrate:v:1 0.3M -bufsize:v:1 0.5M -preset fast -g 48 -sc_threshold 0 -keyint_min 48 \
    -map a:0 -c:a:0 aac -b:a:2 64k -ac 2 \
    -map a:0 -c:a:1 aac -b:a:3 38k -ac 2 \
    -f hls \
    -hls_time 2 \
    -hls_playlist_type vod \
    -hls_flags independent_segments \
    -hls_segment_type mpegts \
    -hls_segment_filename ktv_output/"$2"/stream_%v_data%02d.ts \
    -master_pl_name master.m3u8 \
    -var_stream_map "v:0,a:0 v:1,a:1" ktv_output/"$2"/stream_%v.m3u8
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
