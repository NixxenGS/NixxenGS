plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Release signing: CI secrets win when present (see README); otherwise the
// sideload keystore checked into keystore/ keeps every build installable over
// the previous one.
val ksFile = System.getenv("SW_KEYSTORE_FILE")?.let { file(it) } ?: rootProject.file("keystore/sideload.jks")
val ksPassword = System.getenv("SW_KEYSTORE_PASSWORD") ?: "swcompanion"
val ksAlias = System.getenv("SW_KEY_ALIAS") ?: "swcompanion"
val ksKeyPassword = System.getenv("SW_KEY_PASSWORD") ?: ksPassword

val buildNumber = (project.findProperty("buildNumber") as String?)?.toIntOrNull() ?: 1

android {
    namespace = "com.nixxengs.swcompanion"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.nixxengs.swcompanion"
        minSdk = 26
        targetSdk = 35
        versionCode = buildNumber
        versionName = "1.0.$buildNumber"
    }

    signingConfigs {
        create("release") {
            storeFile = ksFile
            storePassword = ksPassword
            keyAlias = ksAlias
            keyPassword = ksKeyPassword
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.getByName("release")
        }
        debug {
            applicationIdSuffix = ".debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }

    androidResources {
        // index.html ships byte-for-byte; the woff2 fonts are already compressed.
        noCompress += listOf("html", "js", "css", "woff2")
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.core:core-splashscreen:1.0.1")
}
