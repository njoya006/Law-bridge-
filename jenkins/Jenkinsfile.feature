// LawBridge — feature branch / PR pipeline (test + build only, no push/deploy)
pipeline {
    agent any

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '15'))
    }

    environment {
        PYTHON_VERSION = '3.11'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                }
            }
        }

        stage('Detect Changed Services') {
            steps {
                script {
                    env.CHANGED_SERVICES = sh(
                        script: 'bash jenkins/scripts/detect-changed-services.sh',
                        returnStdout: true
                    ).trim()
                    env.FRONTEND_CHANGED = sh(
                        script: 'bash jenkins/scripts/detect-frontend-changed.sh',
                        returnStdout: true
                    ).trim()
                    if (!env.CHANGED_SERVICES?.trim()) {
                        env.CHANGED_SERVICES = 'auth-service'
                    }
                }
            }
        }

        stage('Unit Tests') {
            steps {
                sh 'bash jenkins/scripts/run-service-tests.sh'
            }
            post {
                always {
                    junit allowEmptyResults: true, skipPublishingChecks: true, testResults: '**/test-results/*.xml, **/junit.xml'
                }
            }
        }

        stage('Frontend Build') {
            when {
                expression { env.FRONTEND_CHANGED == 'true' }
            }
            steps {
                dir('lawbridge-frontend') {
                    sh 'npm ci && npm run build'
                }
            }
        }

        stage('SonarQube Analysis') {
            when {
                expression { env.SONAR_SKIP != 'true' }
            }
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        if command -v sonar-scanner >/dev/null 2>&1; then
                          sonar-scanner \
                            -Dsonar.projectKey=lawbridge \
                            -Dsonar.projectBaseDir=. \
                            -Dsonar.sources=services/ \
                            -Dsonar.python.coverage.reportPaths=**/coverage.xml
                        else
                          echo "sonar-scanner not installed — skipping"
                        fi
                    '''
                }
            }
        }

        stage('Docker Build (no push)') {
            steps {
                sh 'bash jenkins/scripts/build-images-local.sh'
            }
        }
    }

    post {
        success {
            script {
                if (env.CHANGE_ID) {
                    echo "PR #${env.CHANGE_ID} checks passed for commit ${env.GIT_COMMIT_SHORT}"
                }
            }
        }
        failure {
            echo 'Feature pipeline failed — fix tests before merging.'
        }
    }
}
