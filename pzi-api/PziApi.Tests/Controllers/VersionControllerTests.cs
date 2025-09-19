using Microsoft.AspNetCore.Mvc;
using PziApi.Controllers;
using FluentAssertions;

namespace PziApi.Tests.Controllers;

public class VersionControllerTests
{
    private readonly VersionController _controller;

    public VersionControllerTests()
    {
        _controller = new VersionController();
    }

    [Fact]
    public void GetFullVersion_WithEnvironmentVariable_ReturnsEnvironmentVersion()
    {
        // Arrange
        const string expectedVersion = "1.0.0-test";
        Environment.SetEnvironmentVariable("APP_VERSION_FULL", expectedVersion);

        // Act
        var result = _controller.GetFullVersion() as OkObjectResult;

        // Assert
        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(200);

        var value = result.Value as dynamic;
        ((string)value!.version).Should().Be(expectedVersion);

        // Cleanup
        Environment.SetEnvironmentVariable("APP_VERSION_FULL", null);
    }

    [Fact]
    public void GetFullVersion_WithoutEnvironmentVariable_ReturnsAssemblyVersion()
    {
        // Arrange
        Environment.SetEnvironmentVariable("APP_VERSION_FULL", null);

        // Act
        var result = _controller.GetFullVersion() as OkObjectResult;

        // Assert
        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(200);

        var value = result.Value as dynamic;
        ((string)value!.version).Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void GetShortVersion_WithEnvironmentVariable_ReturnsEnvironmentVersion()
    {
        // Arrange
        const string expectedVersion = "1.0.0";
        Environment.SetEnvironmentVariable("APP_VERSION_SHORT", expectedVersion);

        // Act
        var result = _controller.GetShortVersion() as OkObjectResult;

        // Assert
        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(200);

        var value = result.Value as dynamic;
        ((string)value!.version).Should().Be(expectedVersion);

        // Cleanup
        Environment.SetEnvironmentVariable("APP_VERSION_SHORT", null);
    }

    [Fact]
    public void GetShortVersion_WithoutEnvironmentVariable_ReturnsAssemblyVersion()
    {
        // Arrange
        Environment.SetEnvironmentVariable("APP_VERSION_SHORT", null);

        // Act
        var result = _controller.GetShortVersion() as OkObjectResult;

        // Assert
        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(200);

        var value = result.Value as dynamic;
        ((string)value!.version).Should().NotBeNullOrEmpty();
    }
}