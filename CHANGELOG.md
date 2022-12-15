# Changelog
All notable changes to this project from 2.0.0 forward will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2022-12-15
Code Refactoring

### Removed
- Removed `ContextualBinding.prototype.giveConfig` method
- Removed `Container.prototype.set` method
- Removed `Config` interface

### Added
- Added all public methods to `Container` interface
- Added CHANGELOG

### Changed
- Changed interface `ContextualBindingBuilder` to `ContextualBindingBuilderI`
- Changed interface `Container` to `ContainerI`
- Changed `ContainerConcreteFunction`, now is called with a single parameter of type `CallbackWithContainerParameters`
- Changed `ContainerExtendFunction`, now is called with a single parameter of type `CallbackWithContainerInstance`
- Changed `ContainerMethodBindingFunction`, now is called with a single parameter of type `CallbackWithContainerInstance`
- Changed `ContainerBeforeResolvingFunction`, now is called with a single parameter of type `CallbackWithContainerInstanceParameters`
- Changed `ContainerResolvingFunction`, now is called with a single parameter of type `CallbackWithContainerInstance`
- Changed `ContainerAfterResolvingFunction`, now is called with a single parameter of type `CallbackWithContainerInstance`
- Changed `ContainerReboundFunction`, now is called with a single parameter of type `CallbackWithContainerInstance`


### Fixed
- Fixed Documentation
- Fixed Tests
