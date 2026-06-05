FROM jenkins/jenkins:lts-jdk17

USER root

RUN apt-get update -qq \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq --no-install-recommends \
        python3 python3-venv python3-pip git curl docker.io \
    && rm -rf /var/lib/apt/lists/* \
    && usermod -aG docker jenkins

USER jenkins
