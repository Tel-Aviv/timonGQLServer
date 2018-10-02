CREATE TABLE `snaps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cameraId` int(11) NOT NULL,
  `lpr` varchar(45) NOT NULL,
  `direction` varchar(45) NOT NULL,
  `vehicleType` varchar(45) NOT NULL,
  `dateTime` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_snaps_lpr` (`lpr`),
  KEY `idx_snaps_cameraId` (`cameraId`)
) ENGINE=InnoDB AUTO_INCREMENT=2900359 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
