using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Konscious.Security.Cryptography;

namespace PromptDraft.ServerManager.Security;

public sealed class OwnerAuthService
{
    private readonly string _credentialPath;

    public OwnerAuthService()
    {
        var root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PromptDraftServerManager");
        Directory.CreateDirectory(root);
        _credentialPath = Path.Combine(root, "owner.auth");
    }

    public bool IsConfigured => File.Exists(_credentialPath);

    public async Task InitializeAsync(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var verifier = await DeriveAsync(password, salt);
        var payload = new OwnerCredential(Convert.ToBase64String(salt), Convert.ToBase64String(verifier));
        await File.WriteAllTextAsync(_credentialPath, JsonSerializer.Serialize(payload));
    }

    public async Task<bool> VerifyAsync(string password)
    {
        try
        {
            var payload = JsonSerializer.Deserialize<OwnerCredential>(await File.ReadAllTextAsync(_credentialPath));
            if (payload is null) return false;
            var salt = Convert.FromBase64String(payload.Salt);
            var expected = Convert.FromBase64String(payload.Verifier);
            var actual = await DeriveAsync(password, salt);
            return CryptographicOperations.FixedTimeEquals(expected, actual);
        }
        catch
        {
            return false;
        }
    }

    private static async Task<byte[]> DeriveAsync(string password, byte[] salt)
    {
        using var argon = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            DegreeOfParallelism = 2,
            Iterations = 4,
            MemorySize = 65536
        };
        return await argon.GetBytesAsync(32);
    }

    private sealed record OwnerCredential(string Salt, string Verifier);
}
