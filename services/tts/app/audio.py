import io
import struct


def pcm_float_to_wave(samples, sample_rate: int) -> bytes:
    """Converte amostras float32 em [-1, 1] (formato comum de saida do Kokoro)
    para um arquivo WAV PCM16 mono, que o navegador reproduz nativamente."""
    pcm16 = bytearray()
    for sample in samples:
        clamped = max(-1.0, min(1.0, float(sample)))
        pcm16 += struct.pack("<h", int(clamped * 32767))
    return pcm_bytes_to_wave(bytes(pcm16), sample_rate)


def pcm_bytes_to_wave(pcm: bytes, sample_rate: int, channels: int = 1, bits_per_sample: int = 16) -> bytes:
    buffer = io.BytesIO()
    byte_rate = sample_rate * channels * bits_per_sample // 8
    block_align = channels * bits_per_sample // 8
    buffer.write(b"RIFF")
    buffer.write(struct.pack("<I", 36 + len(pcm)))
    buffer.write(b"WAVE")
    buffer.write(b"fmt ")
    buffer.write(struct.pack("<IHHIIHH", 16, 1, channels, sample_rate, byte_rate, block_align, bits_per_sample))
    buffer.write(b"data")
    buffer.write(struct.pack("<I", len(pcm)))
    buffer.write(pcm)
    return buffer.getvalue()
