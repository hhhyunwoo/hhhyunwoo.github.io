ffprobe 사용
docker run --rm -v /home/deploy/hans/src/eng_pronun_command_server/uploaded_files:/config idock.daumkakao.io/marco_kyh/speech-server:pron_assessment ffprobe -v quiet -print_format json -show_format -show_streams /config/test1.wav

{
"streams": [
{
"index": 0,
"codec_name": "pcm_s16le",
"codec_long_name": "PCM signed 16-bit little-endian",
"codec_type": "audio",
"codec_time_base": "1/16000",
"codec_tag_string": "[1][0][0][0]",
"codec_tag": "0x0001",
"sample_fmt": "s16",
"sample_rate": "16000",
"channels": 1,
"bits_per_sample": 16,
"r_frame_rate": "0/0",
"avg_frame_rate": "0/0",
"time_base": "1/16000",
"duration_ts": 49920,
"duration": "3.120000",
"bit_rate": "256000",
"disposition": {
"default": 0,
"dub": 0,
"original": 0,
"comment": 0,
"lyrics": 0,
"karaoke": 0,
"forced": 0,
"hearing_impaired": 0,
"visual_impaired": 0,
"clean_effects": 0,
"attached_pic": 0,
"timed_thumbnails": 0
}
}
],
"format": {
"filename": "/config/000060153.WAV",
"nb_streams": 1,
"nb_programs": 0,
"format_name": "wav",
"format_long_name": "WAV / WAVE (Waveform Audio)",
"duration": "3.120000",
"size": "99884",
"bit_rate": "256112",
"probe_score": 99
}
}

ffmpeg 사용
docker run --rm -v /home/deploy/hans/src/eng_pronun_command_server/uploaded_files:/config idock.daumkakao.io/marco_kyh/speech-server:pron_assessment ffmpeg -i /config/test1.wav

ffmpeg version n4.3.1 Copyright (c) 2000-2020 the FFmpeg developers
built with gcc 4.8.5 (GCC) 20150623 (Red Hat 4.8.5-44)
configuration: --prefix=/opt/dialoid --disable-shared --pkg-config-flags=--static --disable-gpl --enable-libfdk-aac --enable-libmp3lame --enable-libvorbis
libavutil 56. 51.100 / 56. 51.100
libavcodec 58. 91.100 / 58. 91.100
libavformat 58. 45.100 / 58. 45.100
libavdevice 58. 10.100 / 58. 10.100
libavfilter 7. 85.100 / 7. 85.100
libswscale 5. 7.100 / 5. 7.100
libswresample 3. 7.100 / 3. 7.100
Guessed Channel Layout for Input Stream #0.0 : mono
Input #0, wav, from '/config/000060153.WAV':
Duration: 00:00:03.12, bitrate: 256 kb/s
Stream #0:0: Audio: pcm_s16le ([1][0][0][0] / 0x0001), 16000 Hz, mono, s16, 256 kb/s
At least one output file must be specified

audio 변환
docker run --rm -v /home/deploy/hans/src:/config idock.daumkakao.io/marco_kyh/speech-server:pron_assessment ffmpeg -y -i /config/test1.aac -f s16le -ac 1 -ar 16000 /config/test1.wav
