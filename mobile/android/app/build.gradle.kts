import java.io.FileInputStream
import java.io.InputStreamReader
import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// Release signing config. The keystore + credentials are never committed:
// local builds read them from app/key.properties (gitignored); CI writes the
// same file from GitHub Secrets before building. When neither is present we
// fall back to the debug key so the project still builds out of the box.
val releaseSigning = Properties().apply {
    val f = file("key.properties")
    if (f.exists()) load(InputStreamReader(FileInputStream(f), Charsets.UTF_8))
}

android {
    namespace = "com.galasang.gala_sang"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    signingConfigs {
        if (releaseSigning.isNotEmpty()) {
            create("release") {
                storeFile = file(releaseSigning.getProperty("storeFile") ?: "gala-sang-release.jks")
                storePassword = releaseSigning.getProperty("storePassword")
                keyAlias = releaseSigning.getProperty("keyAlias")
                keyPassword = releaseSigning.getProperty("keyPassword")
            }
        }
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.galasang.gala_sang"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        // CI overrides these via env (see .github/workflows/release-android.yml):
        // BUILD_NUMBER -> versionCode (must always increase so phones upgrade),
        // VERSION_NAME -> versionName (from the tag).
        versionCode = System.getenv("BUILD_NUMBER")?.toIntOrNull() ?: flutter.versionCode
        versionName = System.getenv("VERSION_NAME") ?: flutter.versionName
    }

    buildTypes {
        release {
            signingConfig = if (releaseSigning.isNotEmpty()) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }
}

flutter {
    source = "../.."
}
