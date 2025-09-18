FROM mcr.microsoft.com/dotnet/sdk:8.0

ARG APP_VERSION_FULL
ARG APP_VERSION_SHORT
ENV APP_VERSION_FULL=$APP_VERSION_FULL
ENV APP_VERSION_SHORT=$APP_VERSION_SHORT
# RUN apt-get update 
# RUN apt-get install --upgrade -y libldap-2.5.0 
# RUN ln -s /usr/lib/x86_64-linux-gnu/libldap.so.2 /usr/lib/libldap-2.5.so.0

ENV ASPNETCORE_HTTP_PORTS=8080

WORKDIR /app

COPY /out/. .

EXPOSE 8080

ENTRYPOINT ["dotnet", "PziLogin.dll"]
