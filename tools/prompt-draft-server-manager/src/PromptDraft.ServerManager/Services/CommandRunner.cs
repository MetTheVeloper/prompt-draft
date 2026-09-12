using System.Diagnostics;

namespace PromptDraft.ServerManager.Services;

public sealed record CommandResult(int ExitCode, string StdOut, string StdErr)
{
    public string Summary => ExitCode == 0 ? (string.IsNullOrWhiteSpace(StdOut) ? "Command completed successfully." : StdOut.Trim()) : (string.IsNullOrWhiteSpace(StdErr) ? $"Command failed with exit code {ExitCode}." : StdErr.Trim());
}

public sealed class CommandRunner
{
    public async Task<CommandResult> RunAsync(string fileName, IEnumerable<string> arguments, string workingDirectory, TimeSpan timeout, CancellationToken cancellationToken)
    {
        var psi = new ProcessStartInfo(fileName)
        {
            WorkingDirectory = workingDirectory,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true
        };

        foreach (var argument in arguments) psi.ArgumentList.Add(argument);

        using var process = new Process { StartInfo = psi, EnableRaisingEvents = true };
        process.Start();
        var stdoutTask = process.StandardOutput.ReadToEndAsync(cancellationToken);
        var stderrTask = process.StandardError.ReadToEndAsync(cancellationToken);

        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(timeout);
        try
        {
            await process.WaitForExitAsync(timeoutCts.Token);
        }
        catch (OperationCanceledException)
        {
            if (!process.HasExited) process.Kill(entireProcessTree: true);
            throw;
        }

        return new CommandResult(process.ExitCode, await stdoutTask, await stderrTask);
    }
}
