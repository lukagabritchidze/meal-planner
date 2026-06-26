package com.mealplanner.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;

/**
 * Applies lightweight schema patches that Hibernate ddl-auto may not apply safely on
 * existing PostgreSQL data (e.g. adding a NOT NULL user_id column).
 */
@Component
@Order(0)
public class DatabaseSchemaMigrationRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSchemaMigrationRunner.class);

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    public DatabaseSchemaMigrationRunner(JdbcTemplate jdbcTemplate, DataSource dataSource) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) {
        patchShoppingListCheckedStateUserScope();
    }

    private void patchShoppingListCheckedStateUserScope() {
        try {
            if (!tableExists("shopping_list_checked_state")) {
                return;
            }

            if (!columnExists("shopping_list_checked_state", "user_id")) {
                log.info("Adding user_id column to shopping_list_checked_state");
                jdbcTemplate.execute(
                        "ALTER TABLE shopping_list_checked_state ADD COLUMN user_id BIGINT"
                );
            }

            int updated = jdbcTemplate.update(
                    "UPDATE shopping_list_checked_state SET user_id = 1 WHERE user_id IS NULL"
            );
            if (updated > 0) {
                log.info("Backfilled user_id on {} shopping_list_checked_state row(s)", updated);
            }
        } catch (Exception exception) {
            log.error("Unable to patch shopping_list_checked_state schema", exception);
        }
    }

    private boolean tableExists(String tableName) {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metadata = connection.getMetaData();
            String catalog = connection.getCatalog();

            try (ResultSet tables = metadata.getTables(catalog, null, tableName, new String[]{"TABLE"})) {
                if (tables.next()) {
                    return true;
                }
            }
            try (ResultSet tables = metadata.getTables(catalog, null, tableName.toLowerCase(), new String[]{"TABLE"})) {
                return tables.next();
            }
        } catch (Exception exception) {
            log.warn("Could not inspect database metadata for table {}", tableName, exception);
            return false;
        }
    }

    private boolean columnExists(String tableName, String columnName) {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metadata = connection.getMetaData();
            String catalog = connection.getCatalog();

            try (ResultSet columns = metadata.getColumns(catalog, null, tableName, columnName)) {
                if (columns.next()) {
                    return true;
                }
            }
            try (ResultSet columns = metadata.getColumns(catalog, null, tableName.toLowerCase(), columnName.toLowerCase())) {
                return columns.next();
            }
        } catch (Exception exception) {
            log.warn("Could not inspect database metadata for {}.{}", tableName, columnName, exception);
            return false;
        }
    }
}
