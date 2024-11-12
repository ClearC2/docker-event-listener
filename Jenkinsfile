pipeline {
    environment {
        registryCredential = 'docker-hub'
        dockerImage = null
    }
    agent any

    stages {
        stage('Building image') {
            steps {
                sh "docker info"
                script {
                    def pkg = readJSON file: "package.json"
                    COMMIT = sh(script: "git log -n 1 --pretty=format:'%h'", returnStdout: true)
                    env.DOCKER_IMAGE = "clearc2/docker-event-listener:${pkg.version}-${env.BRANCH_NAME}-${COMMIT}"
                    dockerImage = docker.build("${env.DOCKER_IMAGE}", "--pull --no-cache .")
                }
            }
        }
        stage('Push image') {
            when {
                branch 'main'
            }
            steps {
                script {
                    docker.withRegistry('', registryCredential) {
                        dockerImage.push()
                    }
                }
            }
        }
        stage('Remove built docker image') {
            steps{
                sh "docker rmi ${env.DOCKER_IMAGE}"
            }
        }
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh """ssh root@oson-app.clearc2.com << HERE
                    set -ex
                    docker image prune -a -f --filter label=project=docker-event-listener
                    docker pull ${env.DOCKER_IMAGE}
                    docker stop docker-event-listener || true
                    docker rm docker-event-listener || true
                    docker run --env-file=/srv/docker-event-listener/app.env --name docker-event-listener --restart unless-stopped -d ${env.DOCKER_IMAGE}
                    docker image prune -a --filter "until=2h" -f || true
HERE"""
            }
        }
    }
    post {
        always {
            script {
                cleanWs()
                dir("${env.WORKSPACE}@tmp") {
                    deleteDir()
                }
            }
        }
    }
}
