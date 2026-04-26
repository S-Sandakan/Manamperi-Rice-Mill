package com.manamperi.mrms.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI mrmsOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("MRMS - Manamperi Rice Mill ERP API")
                        .description("Enterprise Rice Mill Management System REST API Documentation")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Manamperi Rice Mill")
                                .email("info@manamperi.lk")))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .bearerFormat("JWT")
                                        .scheme("bearer")));
    }
}
