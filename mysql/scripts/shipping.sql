CREATE DATABASE cities;
CREATE USER 'shipping'@'%' IDENTIFIED BY 'secret';
GRANT ALL PRIVILEGES ON cities.* TO 'shipping'@'%';
FLUSH PRIVILEGES;

USE cities;

CREATE TABLE codes (
    code VARCHAR(10) NOT NULL,
    name VARCHAR(50) NOT NULL,
    PRIMARY KEY (code)
);

-- Example data
INSERT INTO codes (code, name) VALUES 
('US', 'United States'),
('CA', 'Canada'),
('NG', 'Nigeria');

ALTER TABLE codes
ADD COLUMN uuid BIGINT AUTO_INCREMENT UNIQUE FIRST;