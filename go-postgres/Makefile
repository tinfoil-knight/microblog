default:
	@echo "Specify a command to run with make"

codegen:
	@echo "> Generating code"
	sqlc generate --experimental

run:
	@echo "> Running main"
	go run .

build:
	@echo "> Building source"
	go build .

.PHONY: codegen run

